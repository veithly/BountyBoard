import type { Action, IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import type { Transaction } from "../types";
import { mainnet, base, anvil, lineaSepolia } from "viem/chains";
import bountyboardAbi from "./BountyBoard.json";

export const reviewTemplate = `Given the recent messages and task submission information below:

{{recentMessages}}

{{submissionInfo}}

Extract the following information about the review decision:
- Board ID
- Task ID
- Submitter address
- Review status (-1 for reject, 1 for approve)
- Review comment

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "boardId": number | null,
    "taskId": number | null,
    "submitter": string | null,
    "status": number | null,
    "reviewComment": string | null
}
\`\`\`
`;

export class ReviewAction {
    constructor(private walletProvider: WalletProvider) {}

    async review(
        runtime: IAgentRuntime,
        params: {
            boardId: number;
            taskId: number;
            submitter: string;
            status: number;
            reviewComment: string;
        }
    ): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient();
        const [reviewerAddress] = await walletClient.getAddresses();
        const contractAddress = runtime.getSetting(
            "BOUNTYBOARD_ADDRESS"
        ) as `0x${string}`;
        const contractAbi = bountyboardAbi;

        // Get chain configuration based on settings
        const chainName = runtime.getSetting("CHAIN_NAME");
        let chain;
        switch (chainName) {
            case "ethereum":
                chain = mainnet;
                break;
            case "base":
                chain = base;
                break;
            case "anvil":
                chain = anvil;
                break;
            case "linea_testnet":
                chain = lineaSepolia;
                break;
            default:
                throw new Error(`Unsupported chain: ${chainName}`);
        }

        try {
            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: "reviewSubmission",
                args: [
                    BigInt(params.boardId),
                    BigInt(params.taskId),
                    params.submitter as `0x${string}`,
                    params.status,
                    params.reviewComment,
                ],
                chain: chain,
                account: reviewerAddress,
            });

            return {
                hash,
                from: reviewerAddress,
                to: contractAddress,
                value: BigInt(0),
                chainId: chain.id,
            };
        } catch (error) {
            throw new Error(`Review submission failed: ${error.message}`);
        }
    }
}

export const reviewAction: Action = {
    name: "review",
    description: "Review a task submission on a bounty board",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: any
    ): Promise<Transaction | false> => {
        try {
            const walletProvider = new WalletProvider(runtime);
            const action = new ReviewAction(walletProvider);
            return await action.review(runtime, options);
        } catch (error) {
            console.error("Error in review handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime): Promise<boolean> => {
        const privateKey = runtime.getSetting("BOUNTYBOARD_PRIVATE_KEY");
        const walletProvider = new WalletProvider(runtime);
        const contractAddress = runtime.getSetting(
            "BOUNTYBOARD_ADDRESS"
        ) as `0x${string}`;
        const contractAbi = bountyboardAbi;

        // Get chain configuration based on settings
        const chainName = runtime.getSetting("CHAIN_NAME");
        let chain;
        switch (chainName) {
            case "ethereum":
                chain = mainnet;
                break;
            case "base":
                chain = base;
                break;
            case "anvil":
                chain = anvil;
                break;
            case "linea_testnet":
                chain = lineaSepolia;
                break;
            default:
                throw new Error(`Unsupported chain: ${chainName}`);
        }

        const publicClient = walletProvider.getPublicClient(chain);
        const [address] = await walletProvider.getWalletClient().getAddresses();

        try {
            const reviewerRole = await publicClient.readContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: "REVIEWER_ROLE",
                args: [],
            });

            const hasRole = await publicClient.readContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: "hasRole",
                args: [reviewerRole, address],
            });

            return (
                typeof privateKey === "string" &&
                privateKey.startsWith("0x") &&
                hasRole === true
            );
        } catch (error) {
            console.error("Error validating reviewer role:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Review submission for task 1 on board 0 from 0x123...abc - approve with comment 'Great work!'",
                    action: "REVIEW_SUBMISSION",
                },
            },
        ],
    ],
    similes: ["REVIEW_SUBMISSION", "REVIEW_TASK", "CHECK_SUBMISSION"],
};
