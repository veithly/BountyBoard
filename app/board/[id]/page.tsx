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
import Image from "next/image";

// Components
import TaskList from "@/components/TaskList";
import MemberSubmissionTable from "@/components/MemberSubmissionTable";
import DynamicModal from "@/components/DynamicModal";
import BoardActionsDropdown from "@/components/BoardActionsDropdown";
import LoadingSpinner from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import CreateTaskModal from "@/components/CreateTaskModal";

// Contract Hooks & ABI
import {
  useCreateTask,
  useSubmitProof,
  useReviewSubmission,
  useAddReviewerToTask,
  useCancelTask,
  useCloseBoard,
  useWithdrawPledgedTokens,
  useUpdateBountyBoard,
  useJoinBoard,
  usePledgeTokens,
  useUpdateTask,
  useTokenSymbol,
  useApproveTokens,
  useGetTasksForBoard,
  useIsBoardMember,
  useGetBoardDetail,
} from "@/hooks/useContract";
// GraphQL and Contract Addresses
import {
  BoardDetailView,
  Submission,
  SubmissionView,
  TaskView,
} from "@/types/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Address } from "@/components/ui/Address";
import { Chain, formatUnits, zeroAddress } from "viem";
import { Info, Calendar, Coins, Users } from "lucide-react";

// Modal Configurations
const modalConfigs = {
  submitProof: {
    title: "Submit Proof",
    description: "Submit your proof of completion for this task.",
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
    description: "Add a reviewer to this task.",
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
  pledgeTokens: {
    title: "Pledge Tokens",
    description: "Pledge tokens to the board.",
    fields: [{ name: "amount", label: "Amount", type: "number" }],
  },
};

// Main Board Page Component
export default function BoardPage() {
  const { id } = useParams();
  const { address, chain } = useAccount();
  const [selectedTask, setSelectedTask] = useState<TaskView>();

  // 使用合约读取函数
  const { data: board, refetch } = useGetBoardDetail(BigInt(id as string));
  console.log("Board:", board);
  const { data: isMember } = useIsBoardMember(
    id as string,
    address as `0x${string}`
  );

  if (!board) {
    return <LoadingSpinner />;
  }

  const isCreator = board.creator.toLowerCase() === address?.toLowerCase();

  const isReviewerForTask = (taskId: bigint) => {
    const TaskView = board.tasks.find((t) => t.id === taskId);
    return TaskView?.reviewers?.includes(address as `0x${string}`);
  };

  return (
    <div className="container mx-auto p-4">
      <BoardDetails
        board={board}
        tasks={board.tasks}
        address={address}
        chain={chain}
        onTaskSelect={setSelectedTask}
        refetch={refetch}
        isCreator={isCreator}
        isMember={isMember}
      />
    </div>
  );
}

// Board Details Component
function BoardDetails({
  board,
  tasks,
  address,
  chain,
  onTaskSelect,
  refetch,
  isCreator,
  isMember,
}: {
  board: BoardDetailView;
  tasks: TaskView[];
  address: `0x${string}` | undefined;
  chain: Chain;
  onTaskSelect: (TaskView: TaskView) => void;
  refetch: () => void;
  isCreator: boolean;
  isMember: boolean;
}) {
  // Contract Hooks
  const createTask = useCreateTask();
  const submitProof = useSubmitProof();
  const reviewSubmission = useReviewSubmission();
  const addReviewerToTask = useAddReviewerToTask();
  const updateBountyBoard = useUpdateBountyBoard();
  const updateTask = useUpdateTask();
  const cancelTask = useCancelTask();
  const closeBoard = useCloseBoard();
  const withdrawPledgedTokens = useWithdrawPledgedTokens();
  const joinBoard = useJoinBoard();
  const approveTokens = useApproveTokens(board.rewardToken);
  const pledgeTokens = usePledgeTokens(board.rewardToken);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<keyof typeof modalConfigs | null>(
    null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<bigint>();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission>();
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const [activeTab, setActiveTab] = useState("bounties");
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>();
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] =
    useState<TaskView>();

  // Modal Handlers
  const handleOpenModal = (
    type: keyof typeof modalConfigs,
    taskId?: bigint,
    submission?: Submission
  ) => {
    setModalType(type);
    setSelectedTaskId(taskId);
    setSelectedSubmission(submission);
    setIsModalOpen(true);

    // 预填充更新表单
    if (type === "updateBoard") {
      // 预填充 board 更新表单
      const initialBoardData = {
        name: board.name,
        description: board.description,
        rewardToken: board.rewardToken === zeroAddress ? "" : board.rewardToken,
      };
      setInitialFormData(initialBoardData);
    } else {
      // 其他类型的 modal 不需要预填充
      setInitialFormData(undefined);
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedTaskId(undefined);
    setIsModalOpen(false);
  };

  // Contract Action Handlers
  const handleAction = async (action: string, taskId?: bigint) => {
    const boardIdNum = board.id;
    let res: {
      hash?: `0x${string}`;
      error?: string;
    };
    switch (action) {
      case "approveTokens":
        res = await approveTokens(BigInt(10 ^ 53));
        break;
      case "joinBoard":
        res = await joinBoard({ boardId: boardIdNum });
        break;
      case "cancelBounty":
        res = await cancelTask({
          boardId: boardIdNum,
          taskId: taskId,
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

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  // 监听交易确认状态
  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Waiting for transaction confirmation...</span>
          </div>
        ),
      });
    } else if (isConfirmed) {
      toast({
        title: "Success!",
        description: "Transaction confirmed.",
      });
      setTransactionHash(undefined); // 重置交易哈希值
      refetch();
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
    const boardIdNum = board.id;
    const taskIdNum = selectedTaskId ?? 0;
    let result: {
      hash?: string;
    };
    switch (modalType) {
      case "submitProof":
        result = await submitProof({
          boardId: boardIdNum,
          taskId: taskIdNum,
          proof: JSON.stringify(data.proof),
        });
        break;
      case "addReviewer":
        result = await addReviewerToTask({
          boardId: boardIdNum,
          taskId: taskIdNum,
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

  // 处理创建任务
  const handleCreateTask = async (data: any) => {
    const result = await createTask({
      boardId: board.id,
      name: data.name,
      description: data.description,
      deadline: data.deadline,
      maxCompletions: data.maxCompletions,
      rewardAmount: data.rewardAmount,
      config: data.config,
      allowSelfCheck: data.allowSelfCheck,
    });
    return result;
  };

  // 处理更新任务
  const handleUpdateTask = async (data: any) => {
    if (!selectedTaskForUpdate) return;
    const result = await updateTask({
      boardId: board.id,
      taskId: selectedTaskForUpdate.id,
      name: data.name,
      description: data.description,
      deadline: data.deadline,
      maxCompletions: data.maxCompletions,
      rewardAmount: data.rewardAmount,
      config: data.config,
      allowSelfCheck: data.allowSelfCheck,
    });
    return result;
  };

  // 打开更新任务模态框
  const handleOpenUpdateTaskModal = (task: TaskView) => {
    setSelectedTaskForUpdate(task);
    setIsUpdateTaskModalOpen(true);
  };

  return (
    <Card>
      {board.img && (
        <div className="relative w-full h-64 overflow-hidden rounded-t-lg">
          <Image
            src={board.img}
            alt={board.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.png";
            }}
          />
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {board.name}
              {board.closed && (
                <Badge variant="destructive" className="ml-2">
                  Closed
                </Badge>
              )}
            </CardTitle>
          </div>
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
          {format(new Date(Number(board.createdAt) * 1000), "PPP")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Coins className="h-4 w-4" />
          <strong>Reward Token:</strong>{" "}
          {tokenSymbol.data ??
            ((board.rewardToken === zeroAddress && "ETH") || "")}
          {!(board.rewardToken === zeroAddress) && (
            <Address address={board.rewardToken} />
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Coins className="h-4 w-4" />
          <strong>Total Pledged:</strong>{" "}
          {formatUnits(BigInt(board.totalPledged), 18)}{" "}
          {tokenSymbol.data ??
            ((board.rewardToken === zeroAddress && "ETH") || "")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <strong>Creator:</strong> <Address address={board.creator} />
        </div>

        {/* Join Board Button */}
        {address && !isMember && (
          <Button onClick={() => handleAction("joinBoard")}>Join Board</Button>
        )}

        {/* Add Bounty Button */}
        {isCreator && (
          <Button onClick={() => setIsCreateTaskModalOpen(true)}>
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
            {/* Task List */}
            <TaskList
              boardId={board.id}
              tasks={board.tasks}
              userTaskStatuses={board.userTaskStatuses}
              address={address}
              chain={chain}
              onTaskSelect={onTaskSelect}
              onOpenSubmitProofModal={(taskId) =>
                handleOpenModal("submitProof", taskId)
              }
              onOpenAddReviewerModal={(taskId) =>
                isCreator && handleOpenModal("addReviewer", taskId)
              }
              onOpenUpdateTaskModal={(taskId) => {
                const task = board.tasks.find((t) => t.id === taskId);
                if (task && isCreator) {
                  handleOpenUpdateTaskModal(task);
                }
              }}
              onCancelTask={(taskId) =>
                isCreator && handleAction("cancelTask", taskId)
              }
              refetch={refetch}
            />
          </TabsContent>
          <TabsContent value="submissions">
            {/* Member Submission Table */}
            <MemberSubmissionTable
              board={board}
              address={address}
              refetch={refetch}
            />
          </TabsContent>
        </Tabs>

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onSubmit={handleCreateTask}
          onConfirmed={refetch}
        />

        {/* Update Task Modal */}
        {selectedTaskForUpdate && (
          <CreateTaskModal
            isOpen={isUpdateTaskModalOpen}
            onClose={() => {
              setIsUpdateTaskModalOpen(false);
              setSelectedTaskForUpdate(undefined);
            }}
            onSubmit={handleUpdateTask}
            onConfirmed={refetch}
            initialData={{
              taskBasicInfo: {
                name: selectedTaskForUpdate.name,
                description: selectedTaskForUpdate.description,
              },
              taskDetails: {
                deadline: new Date(
                  Number(selectedTaskForUpdate.deadline) * 1000
                ),
                maxCompletions: Number(selectedTaskForUpdate.maxCompletions),
                rewardAmount: Number(
                  formatUnits(selectedTaskForUpdate.rewardAmount, 18)
                ),
              },
              taskConfig: selectedTaskForUpdate.config
                ? {
                    ...JSON.parse(selectedTaskForUpdate.config),
                    taskType:
                      JSON.parse(selectedTaskForUpdate.config).taskType || [],
                  }
                : { taskType: [] },
              selectedTypes: selectedTaskForUpdate.config
                ? JSON.parse(selectedTaskForUpdate.config).taskType || []
                : [],
            }}
          />
        )}

        {/* Other Modals */}
        {modalType && (
          <DynamicModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            config={modalConfigs[modalType]}
            selectedSubmission={selectedSubmission}
            initialData={initialFormData}
            onSubmit={handleModalSubmit}
            onConfirmed={refetch}
          />
        )}
      </CardContent>
    </Card>
  );
}
