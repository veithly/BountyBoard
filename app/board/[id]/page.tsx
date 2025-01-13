"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState, useMemo } from "react";
import { format, set } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { SiDiscord } from "@icons-pack/react-simple-icons";

// Components
import TaskList from "@/components/TaskList";
import MemberSubmissionTable from "@/components/MemberSubmissionTable";
import DynamicModal from "@/components/DynamicModal";
import BoardActionsDropdown from "@/components/BoardActionsDropdown";
import { Badge } from "@/components/ui/badge";
import CreateTaskModal from "@/components/CreateTaskModal";
import BoardForm from "@/components/BoardForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  useGetProfiles,
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
import { Info, Calendar, Coins, Users, User2 } from "lucide-react";
import { getNativeTokenSymbol } from "@/utils/chain";

// Modal Configurations
export const modalConfigs = {
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
      { name: "img", label: "Image", type: "image" },
      { name: "rewardToken", label: "Reward Token Address", type: "text" },
    ],
  },
  pledgeTokens: {
    title: "Pledge Tokens",
    description: "Pledge tokens to the board.",
    fields: [{ name: "amount", label: "Amount", type: "number" }],
  },
};

// Add type guard helper function at the top of the file
function isBoardDetailView(obj: any): obj is BoardDetailView {
  return obj && typeof obj === "object" && "tasks" in obj && "creator" in obj;
}

// Main Board Page Component
export default function BoardPage() {
  const { id } = useParams();
  const { address, chain, isConnected } = useAccount();
  const [selectedTask, setSelectedTask] = useState<TaskView>();

  const { data: board, refetch } = useGetBoardDetail(BigInt(id as string));

  // 获取所有需要获取资料的地址
  const addressesToFetch = useMemo(() => {
    if (!board || typeof board !== "object") return [];

    const addresses = new Set<`0x${string}`>();

    if ("creator" in board && typeof board.creator === "string") {
      addresses.add(board.creator.toLowerCase() as `0x${string}`);
    }

    if ("members" in board && Array.isArray(board.members)) {
      board.members.forEach((member: `0x${string}`) => {
        addresses.add(member.toLowerCase() as `0x${string}`);
      });
    }

    if ("tasks" in board && Array.isArray(board.tasks)) {
      board.tasks.forEach((task: TaskView) => {
        addresses.add(task.creator.toLowerCase() as `0x${string}`);
        task.reviewers?.forEach((reviewer: `0x${string}`) => {
          addresses.add(reviewer.toLowerCase() as `0x${string}`);
        });
      });
    }

    return Array.from(addresses);
  }, [board]);

  // 批量获取用户资料
  const { data: profilesData } = useGetProfiles(addressesToFetch);

  // 将资料数据转换为映射格式
  const userProfiles = useMemo(() => {
    if (!profilesData || !Array.isArray(profilesData)) return {};

    const [nicknames, avatars, socialAccounts, _, __] = profilesData;
    return addressesToFetch.reduce((acc, address, index) => {
      acc[address.toLowerCase()] = {
        nickname: nicknames[index],
        avatar: avatars[index],
        socialAccount: socialAccounts[index],
      };
      return acc;
    }, {} as Record<string, { nickname: string; avatar: string; socialAccount: string }>);
  }, [profilesData, addressesToFetch]);

  const { data: isMember = false, refetch: refetchIsMember } = useIsBoardMember(
    id as string,
    address as `0x${string}`
  ) as { data: boolean; refetch: () => void };

  if (!board || !isBoardDetailView(board)) {
    return <BoardSkeleton />;
  }

  return (
    <div className="container mx-auto p-4">
      <BoardDetails
        board={board as BoardDetailView}
        tasks={board.tasks || []}
        address={address}
        chain={chain!}
        onTaskSelect={setSelectedTask}
        refetch={() => {
          refetch();
          refetchIsMember();
        }}
        isCreator={
          isConnected && board.creator.toLowerCase() === address?.toLowerCase()
        }
        isMember={isConnected && isMember}
        userProfiles={userProfiles}
        isWalletConnected={isConnected}
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
  userProfiles,
  isWalletConnected,
}: {
  board: BoardDetailView;
  tasks: TaskView[];
  address: `0x${string}` | undefined;
  chain: Chain;
  onTaskSelect: (TaskView: TaskView) => void;
  refetch: () => void;
  isCreator: boolean;
  isMember: boolean;
  userProfiles: Record<string, { nickname: string; avatar: string }>;
  isWalletConnected: boolean;
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
  const [showBoardForm, setShowBoardForm] = useState(false);

  // Modal Handlers
  const handleOpenModal = (
    type: keyof typeof modalConfigs,
    taskId?: bigint,
    submission?: Submission
  ) => {
    if (type === "updateBoard") {
      setShowBoardForm(true);
    } else {
      setModalType(type);
      setSelectedTaskId(taskId);
      setSelectedSubmission(submission);
      setIsModalOpen(true);
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
        if (!taskId) return { error: "Task ID is required" };
        res = await cancelTask({
          boardId: boardIdNum,
          taskId: BigInt(taskId), // Convert to BigInt
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
    const taskIdNum = selectedTaskId;

    if (
      taskIdNum === undefined &&
      (modalType === "submitProof" || modalType === "addReviewer")
    ) {
      throw new Error("Task ID is required");
    }

    let result: {
      hash?: string;
    };

    switch (modalType) {
      case "submitProof":
        result = await submitProof({
          boardId: boardIdNum,
          taskId: BigInt(taskIdNum!), // Convert to BigInt with non-null assertion
          proof: JSON.stringify(data.proof),
        });
        break;
      case "addReviewer":
        result = await addReviewerToTask({
          boardId: boardIdNum,
          taskId: BigInt(taskIdNum!), // Convert to BigInt with non-null assertion
          reviewer: data.reviewer,
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
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Logo Image */}
            {board.img && (
              <div className="relative w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={board.img}
                  alt={board.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  priority={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.png";
                  }}
                />
              </div>
            )}

            {/* Title and Badge */}
            <div>
              <CardTitle className="flex items-center gap-2 h-8">
                {board.name}
                {board.closed && (
                  <Badge variant="destructive" className="ml-2">
                    Closed
                  </Badge>
                )}
              </CardTitle>
            </div>
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
          <Info className="h-4 w-4 flex-shrink-0" />
          <strong className="flex-shrink-0">Description:</strong>
          <span className="break-words">{board.description}</span>
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
            ((board.rewardToken === zeroAddress &&
              getNativeTokenSymbol(chain)) ||
              "")}
          {!(board.rewardToken === zeroAddress) && (
            <Address address={board.rewardToken} />
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Coins className="h-4 w-4" />
          <strong>Total Pledged:</strong>{" "}
          {formatUnits(BigInt(board.totalPledged), 18)}{" "}
          {tokenSymbol.data ??
            ((board.rewardToken === zeroAddress &&
              getNativeTokenSymbol(chain)) ||
              "")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <strong>Creator:</strong>
          <div className="flex items-center gap-2">
            {userProfiles[board.creator.toLowerCase()]?.avatar ? (
              <Image
                src={userProfiles[board.creator.toLowerCase()].avatar}
                alt="Creator"
                width={16}
                height={16}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.png";
                }}
              />
            ) : (
              <User2 className="h-4 w-4" />
            )}
            <span>
              {userProfiles[board.creator.toLowerCase()]?.nickname || (
                <Address address={board.creator} />
              )}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bounties" className="w-full">
          <TabsList>
            <TabsTrigger value="bounties">Tasks</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="bounties">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Tasks</h3>
              {/* Join Board Button */}
              {address && !isMember && (
                <Button onClick={() => handleAction("joinBoard")}>
                  Join Board
                </Button>
              )}
              {isWalletConnected && isCreator && (
                <div className="flex gap-2">
                  <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                    Create Task
                  </Button>
                  {isCreator && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "https://discord.com/oauth2/authorize?client_id=1309894992713613404",
                          "_blank"
                        )
                      }
                    >
                      <SiDiscord className="mr-2 h-4 w-4" />
                      Add Discord Bot
                    </Button>
                  )}
                </div>
              )}
            </div>
            <TaskList
              tasks={board.tasks}
              boardId={board.id}
              boardConfig={JSON.parse(board.config || "{}")}
              userTaskStatuses={board.userTaskStatuses || []} // Add this prop
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
              onOpenModal={(type: keyof typeof modalConfigs, taskId?: bigint) =>
                handleOpenModal(type, taskId)
              }
              onUpdateTask={(taskId: bigint) => {
                const task = board.tasks.find((t) => t.id === taskId);
                if (task && isCreator) {
                  handleOpenUpdateTaskModal(task);
                }
              }}
              refetch={refetch}
              userProfiles={userProfiles}
              isCreator={isCreator}
              isMember={isMember}
              isWalletConnected={isWalletConnected}
            />
          </TabsContent>
          <TabsContent value="submissions">
            {/* Member Submission Table */}
            <MemberSubmissionTable
              board={board}
              address={address}
              refetch={refetch}
              userProfiles={userProfiles}
            />
          </TabsContent>
        </Tabs>

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onSubmit={handleCreateTask}
          onConfirmed={refetch}
          mode="create"
          boardConfig={JSON.parse(board.config || "{}")}
          tokenSymbol={tokenSymbol.data || getNativeTokenSymbol(chain)}
        />

        {/* Update Task Modal */}
        {selectedTaskForUpdate && (
          <CreateTaskModal
            boardConfig={JSON.parse(board.config)}
            isOpen={isUpdateTaskModalOpen}
            onClose={() => {
              setIsUpdateTaskModalOpen(false);
              setSelectedTaskForUpdate(undefined);
            }}
            onSubmit={handleUpdateTask}
            onConfirmed={refetch}
            mode="update"
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
                allowSelfCheck: selectedTaskForUpdate.allowSelfCheck,
                boardId: board.id,
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
            tokenSymbol={tokenSymbol.data || getNativeTokenSymbol(chain)}
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

        {showBoardForm && (
          <Dialog open={showBoardForm} onOpenChange={setShowBoardForm}>
            <DialogContent className="">
              <DialogHeader>
                <DialogTitle>Update Board</DialogTitle>
              </DialogHeader>
              <BoardForm
                initialData={{
                  id: board.id,
                  name: board.name,
                  description: board.description,
                  img: board.img,
                  rewardToken:
                    board.rewardToken === zeroAddress ? "" : board.rewardToken,
                  config: board.config,
                }}
                onSubmit={updateBountyBoard}
                mode="update"
                redirectPath={`/board/${board.id}`}
                isDialog={true}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function BoardSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Logo Skeleton */}
              <Skeleton className="w-12 h-12 rounded-lg" />

              {/* Title Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-[200px]" />
              </div>
            </div>

            {/* Action Button Skeleton */}
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>

          {/* Info Items Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-[100px]" />
              ))}
            </div>

            {/* Tasks List Skeleton */}
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[200px]" />
                      <Skeleton className="h-4 w-[300px]" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-6 w-[80px]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
