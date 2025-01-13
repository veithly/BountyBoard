import type { Action, IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import { mainnet, base, anvil, lineaSepolia } from "viem/chains";
import bountyboardAbi from "./BountyBoard.json";

export const queryTemplate = `Given the recent messages and board information below:

{{recentMessages}}

Extract the board ID to query:

\`\`\`json
{
    "boardId": number | null
}
\`\`\`
`;

interface BoardDetail {
    id: bigint;
    creator: string;
    name: string;
    description: string;
    img: string;
    totalPledged: bigint;
    createdAt: bigint;
    closed: boolean;
    rewardToken: string;
    tasks: {
        id: bigint;
        name: string;
        creator: string;
        description: string;
        deadline: bigint;
        maxCompletions: bigint;
        numCompletions: bigint;
        reviewers: string[];
        completed: boolean;
        rewardAmount: bigint;
        createdAt: bigint;
        cancelled: boolean;
        config: string;
        allowSelfCheck: boolean;
    }[];
    members: string[];
    submissions: {
        submitter: string;
        proof: string;
        status: number;
        submittedAt: bigint;
        reviewComment: string;
    }[][];
    userTaskStatuses: {
        taskId: bigint;
        submitted: boolean;
        status: number;
        submittedAt: bigint;
        submitProof: string;
        reviewComment: string;
    }[];
    config: string;
}

export class QueryAction {
    constructor(private walletProvider: WalletProvider) {}

    async query(
        runtime: IAgentRuntime,
        params: {
            boardId: number;
        }
    ): Promise<BoardDetail> {
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

        const publicClient = this.walletProvider.getPublicClient(chain);

        try {
            const boardDetail = (await publicClient.readContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: "getBoardDetail",
                args: [BigInt(params.boardId)],
            })) as BoardDetail;

            return boardDetail;
        } catch (error) {
            throw new Error(`Query board detail failed: ${error.message}`);
        }
    }
}

export const queryAction: Action = {
    name: "query",
    description: "Query bounty board details",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: any
    ): Promise<BoardDetail | false> => {
        try {
            const walletProvider = new WalletProvider(runtime);
            const action = new QueryAction(walletProvider);
            return await action.query(runtime, options);
        } catch (error) {
            console.error("Error in query handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime): Promise<boolean> => {
        return true; // Query action doesn't need special validation
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the details of board 1",
                    action: "QUERY_BOARD",
                },
            },
        ],
    ],
    similes: ["QUERY_BOARD", "GET_BOARD_DETAIL", "SHOW_BOARD"],
};
