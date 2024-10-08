"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState } from "react";
import { format, set } from "date-fns";
import { toast } from "@/components/ui/use-toast";

// Components
import BountyList from "@/components/BountyList";
import MemberSubmissionTable from "@/components/MemberSubmissionTable";
import DynamicModal from "@/components/DynamicModal";
import BoardActionsDropdown from "@/components/BoardActionsDropdown";
import LoadingSpinner from "@/components/ui/loading";
import { Badge } from '@/components/ui/badge';

// Contract Hooks & ABI
import {
  useCreateBounty,
  useSubmitProof,
  useReviewSubmission,
  useAddReviewerToBounty,
  useCancelBounty,
  useCloseBoard,
  useWithdrawPledgedTokens,
  useUpdateBountyBoard,
  useJoinBoard,
  usePledgeTokens,
  useUpdateBounty,
  useTokenSymbol,
  useApproveTokens,
} from "@/hooks/contract";
// GraphQL and Contract Addresses
import { BOARD_DETAILS_QUERY } from "@/graphql/queries";
import { Board, Bounty, Submission } from "@/types/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Address } from "@/components/ui/Address";
import { formatUnits, zeroAddress } from "viem";
import { Info, Calendar, Coins, Users } from "lucide-react";

const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT as string;

// Modal Configurations
const modalConfigs = {
  addBounty: {
    title: "Add Bounty",
    description:
      "Create a new bounty with a description, deadline, max completions, and reward amount.",
    fields: [
      { name: "description", label: "Description", type: "text" },
      { name: "deadline", label: "Deadline", type: "date" },
      { name: "maxCompletions", label: "Max Completions", type: "number" },
      { name: "rewardAmount", label: "Reward Amount", type: "number" },
    ],
  },
  submitProof: {
    title: "Submit Proof",
    description: "Submit your proof of completion for this bounty.",
    fields: [{ name: "proof", label: "Proof", type: "textarea" }],
  },
  reviewSubmission: {
    title: "Review Submission",
    description:
      "Review the submitted proof and decide whether to approve or reject it.",
    fields: [{ name: "approved", label: "Approve", type: "checkbox" }],
  },
  addReviewer: {
    title: "Add Reviewer",
    description: "Add a reviewer to this bounty.",
    fields: [{ name: "reviewer", label: "Reviewer Address", type: "text" }],
  },
  updateBoard: {
    title: "Update Board",
    description: "Update the board name, description, and reward token.",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "description", label: "Description", type: "text" },
      { name: "rewardToken", label: "Reward Token Address", type: "text" },
    ],
  },
  updateBounty: {
    title: "Update Bounty",
    description:
      "Update the bounty description, deadline, max completions, and reward amount.",
    fields: [
      { name: "description", label: "Description", type: "text" },
      { name: "deadline", label: "Deadline", type: "date" },
      { name: "maxCompletions", label: "Max Completions", type: "number" },
      { name: "rewardAmount", label: "Reward Amount", type: "number" },
    ],
  },
  pledgeTokens: {
    title: "Pledge Tokens",
    description: "Pledge tokens to the board.",
    fields: [{ name: "amount", label: "Amount", type: "number" }],
  },
};

// Main Board Page Component
export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { address } = useAccount();
  const [selectedBounty, setSelectedBounty] = useState<any>(null);

  const { data: boardData, refetch } = useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      // Fetch data from The Graph
      const boardData: { board: Board } = await request(
        url,
        BOARD_DETAILS_QUERY,
        { boardId }
      );
      return boardData.board;
    },
  });

  if (!boardData) {
    return <LoadingSpinner />;
  }

  const isCreator = address?.toLowerCase() === boardData.creator;
  const isMember = boardData.members.some(
    (member) => member.member === address?.toLowerCase()
  );
  const isReviewerForBounty = (bountyId: string) => {
    const bounty = boardData.bounties.find((b) => b.id === bountyId);
    return bounty?.reviewers.some(
      (reviewer) => reviewer.reviewerAddress === address?.toLowerCase()
    );
  };

  return (
    <div className="container mx-auto p-4">
      <BoardDetails
        board={boardData}
        address={address}
        onBountySelect={setSelectedBounty}
        refetch={refetch}
        isCreator={isCreator}
        isMember={isMember}
        isReviewerForBounty={isReviewerForBounty}
      />
    </div>
  );
}

// Board Details Component
function BoardDetails({
  board,
  address,
  onBountySelect,
  refetch,
  isCreator,
  isMember,
  isReviewerForBounty,
}: {
  board: Board;
  address: string | undefined;
  onBountySelect: (bounty: Bounty) => void;
  refetch: () => void;
  isCreator: boolean;
  isMember: boolean;
  isReviewerForBounty: (bountyId: string) => boolean | undefined;
}) {
  // Contract Hooks
  const createBounty = useCreateBounty();
  const submitProof = useSubmitProof();
  const reviewSubmission = useReviewSubmission();
  const addReviewerToBounty = useAddReviewerToBounty();
  const updateBountyBoard = useUpdateBountyBoard();
  const updateBounty = useUpdateBounty();
  const cancelBounty = useCancelBounty();
  const closeBoard = useCloseBoard();
  const withdrawPledgedTokens = useWithdrawPledgedTokens();
  const joinBoard = useJoinBoard();
  const approveTokens = useApproveTokens(board.rewardToken);
  const pledgeTokens = usePledgeTokens(board.rewardToken);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<keyof typeof modalConfigs | null>(
    null
  );
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission>();
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const [activeTab, setActiveTab] = useState("bounties");

  // Modal Handlers
  const handleOpenModal = (
    type: keyof typeof modalConfigs,
    bountyId?: string,
    submission?: Submission
  ) => {
    setModalType(type);
    setSelectedBountyId(bountyId || null);
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedBountyId(null);
    setIsModalOpen(false);
  };

  // Contract Action Handlers
  const handleAction = async (action: string, bountyId?: string) => {
    const boardIdNum = parseInt(board.id);
    let res: {
      hash?: `0x${string}`;
      error?: string;
    };
    switch (action) {
      case "approveTokens":
        res = await approveTokens(BigInt(10^53));
        break;
      case "joinBoard":
        res = await joinBoard({ boardId: boardIdNum });
        break;
      case "cancelBounty":
        res = await cancelBounty({
          boardId: boardIdNum,
          bountyId: parseInt(bountyId!),
        });
        break;
      case "closeBoard":
        res = await closeBoard({ boardId: boardIdNum });
        break;
      case "withdrawPledgedTokens":
        res = await withdrawPledgedTokens({ boardId: boardIdNum });
        break;
      default:
        res = { error: "Invalid action" };
        break;
    }
    setTransactionHash(res.hash);
    return res;
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed, error } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  // 监听交易确认状态
  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Pending",
        description: "Waiting for transaction confirmation...",
        duration: Infinity,
      });
    } else if (isConfirmed) {
      setTimeout(() => {
        toast({
          title: "Success!",
          description: "Transaction confirmed.",
        });
        setTransactionHash(undefined); // 重置交易哈希值
        refetch();
      }, 3000);
    } else if (error) {
      toast({
        title: "Error!",
        description: "Transaction failed.",
        variant: "destructive",
      });
      setTransactionHash(undefined); // 重置交易哈希值
    }
  }, [isConfirming, isConfirmed, error, refetch]);

  // Modal Submission Handler
  const handleModalSubmit = async (data: any) => {
    const boardIdNum = parseInt(board.id);
    const bountyIdNum = parseInt(selectedBountyId?.split("-")[1]!);
    let result: {
      hash?: string;
    };
    switch (modalType) {
      case "addBounty":
        result = await createBounty({
          boardId: boardIdNum,
          description: data.description,
          deadline: data.deadline,
          maxCompletions: data.maxCompletions,
          rewardAmount: data.rewardAmount,
        });
        break;
      case "submitProof":
        result = await submitProof({
          boardId: boardIdNum,
          bountyId: bountyIdNum,
          proof: data.proof,
        });
        break;
      case "reviewSubmission":
        if (!selectedSubmission) return;
        result = await reviewSubmission({
          boardId: boardIdNum,
          bountyId: bountyIdNum,
          submissionAddress: selectedSubmission.submitter,
          approved: data.approved,
        });
        break;
      case "addReviewer":
        result = await addReviewerToBounty({
          boardId: boardIdNum,
          bountyId: bountyIdNum,
          reviewer: data.reviewer,
        });
        break;
      case "updateBoard":
        result = await updateBountyBoard({
          boardId: boardIdNum,
          name: data.name,
          description: data.description,
          rewardToken: data.rewardToken,
        });
        break;
      case "updateBounty":
        result = await updateBounty({
          boardId: boardIdNum,
          bountyId: bountyIdNum,
          description: data.description,
          deadline: data.deadline,
          maxCompletions: data.maxCompletions,
          rewardAmount: data.rewardAmount,
        });
        break;
      case "pledgeTokens":
        result = await pledgeTokens({
          boardId: boardIdNum,
          amount: data.amount as number,
        });
        break;
      default:
        result = {};
        break;
    }
    return result;
  };

  const tokenSymbol = useTokenSymbol(board.rewardToken);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{board.name}{ board.closed && (<Badge variant="destructive" className="ml-5">Closed</Badge>)}</CardTitle>
          {isCreator && (
            <BoardActionsDropdown
              isCreator={isCreator}
              isMember={isMember}
              rewardTokenAddress={board.rewardToken}
              onApproveTokens={() => handleAction("approveTokens")}
              onOpenUpdateBoardModal={() => handleOpenModal("updateBoard")}
              onCloseBoard={() => handleAction("closeBoard")}
              onWithdrawPledgedTokens={() =>
                handleAction("withdrawPledgedTokens")
              }
              onOpenPledgeTokensModal={() => handleOpenModal("pledgeTokens")}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Info className="h-4 w-4" />
          <strong>Description:</strong> {board.description}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Calendar className="h-4 w-4" />
          <strong>Created:</strong>{" "}
          {format(new Date(parseInt(board.createdAt) * 1000), "PPP")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Coins className="h-4 w-4" />
          <strong>Reward Token:</strong> {tokenSymbol.data  ?? ((board.rewardToken === zeroAddress && 'ETH') || '')}
          {!(board.rewardToken === zeroAddress) && <Address address={board.rewardToken} />}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Coins className="h-4 w-4" />
          <strong>Total Pledged:</strong>{" "}
          {formatUnits(BigInt(board.totalPledged), 18)} {tokenSymbol.data  ?? ((board.rewardToken === zeroAddress && 'ETH') || '')}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <strong>Creator:</strong> <Address address={board.creator} />
        </div>

        {/* Join Board Button */}
        {(address && !isMember) && (
          <Button onClick={() => handleAction("joinBoard")}>Join Board</Button>
        )}

        {/* Add Bounty Button */}
        {isCreator && (
          <Button onClick={() => handleOpenModal("addBounty")}>
            Create Bounty Task
          </Button>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="bounties">Tasks</TabsTrigger>
            <TabsTrigger value="submissions">
              Members and Submissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bounties">
            {/* Bounty List */}
            <BountyList
              bounties={board.bounties}
              address={address}
              onBountySelect={onBountySelect}
              onOpenSubmitProofModal={(bountyId) =>
                handleOpenModal("submitProof", bountyId)
              }
              onOpenAddReviewerModal={(bountyId) =>
                isCreator && handleOpenModal("addReviewer", bountyId)
              }
              onOpenUpdateBountyModal={(bountyId) =>
                isCreator && handleOpenModal("updateBounty", bountyId)
              }
              onCancelBounty={(bountyId) =>
                isCreator && handleAction("cancelBounty", bountyId)
              }
            />
          </TabsContent>
          <TabsContent value="submissions">
            {/* Member Submission Table */}
            <MemberSubmissionTable
              board={board}
              address={address}
              onOpenReviewSubmissionModal={(submission, bounty) => {
                if (isReviewerForBounty(bounty.id)) {
                  handleOpenModal("reviewSubmission", bounty.id, submission);
                }
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Dynamic Modal */}
        {modalType && (
          <DynamicModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            config={modalConfigs[modalType]}
            selectedSubmission={selectedSubmission}
            onSubmit={handleModalSubmit}
            onConfirmed={refetch}
          />
        )}
      </CardContent>
    </Card>
  );
}
