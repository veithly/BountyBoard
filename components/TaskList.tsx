"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Coins,
  MoreHorizontal,
  User2,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { Address } from "./ui/Address";
import { Chain, formatUnits } from "viem";
import {
  TaskView,
  SubmissionProof,
  UserTaskStatus,
  BoardConfig,
} from "@/types/types";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import SubmitProofModal from "./SubmitProofModal";
import { useSubmitProof, useSelfCheckSubmission } from "@/hooks/useContract";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { modalConfigs } from "@/app/board/[id]/page";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface TaskListProps {
  boardId: bigint;
  boardConfig: BoardConfig;
  tasks: TaskView[];
  userTaskStatuses: UserTaskStatus[];
  address: `0x${string}` | undefined;
  chain: Chain;
  onTaskSelect: (task: TaskView) => void;
  onOpenSubmitProofModal: (taskId: bigint) => void;
  onOpenAddReviewerModal: (taskId: bigint) => void;
  onOpenUpdateTaskModal: (taskId: bigint) => void;
  onCancelTask: (taskId: bigint) => void;
  refetch: () => void;
  userProfiles: Record<string, { nickname: string; avatar: string }>;
  isCreator: boolean;
  isMember: boolean;
  onOpenModal: (type: keyof typeof modalConfigs, taskId?: bigint) => void;
  onUpdateTask: (taskId: bigint) => void;
  isWalletConnected: boolean;
}

export default function TaskList({
  boardId,
  boardConfig,
  tasks,
  userTaskStatuses,
  address,
  onTaskSelect,
  onOpenSubmitProofModal,
  onOpenAddReviewerModal,
  onOpenUpdateTaskModal,
  onCancelTask,
  refetch,
  chain,
  userProfiles = {}, // 添加默认空对象
  isCreator: isCreatorProp,
  isMember,
  onOpenModal,
  onUpdateTask,
  isWalletConnected,
}: TaskListProps) {
  const { toast } = useToast();
  const selfCheckSubmission = useSelfCheckSubmission();

  const [customDeadlines, setCustomDeadlines] = useState<
    Record<number, number>
  >({});

  const [remainingTimes, setRemainingTimes] = useState<Record<number, number>>(
    tasks.reduce(
      (acc, task) => ({
        ...acc,
        [Number(task.id)]: Number(task.deadline) * 1000 - Date.now(),
      }),
      {}
    )
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTimes((prevTimes) =>
        tasks.reduce(
          (acc, task) => ({
            ...acc,
            [Number(task.id)]:
              customDeadlines[Number(task.id)] ||
              Number(task.deadline) * 1000 - Date.now(),
          }),
          {}
        )
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, [tasks, customDeadlines]);

  const [isSubmitProofModalOpen, setIsSubmitProofModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);

  const handleOpenSubmitProof = (task: TaskView) => {
    setSelectedTask(task);
    setIsSubmitProofModalOpen(true);
  };

  const submitProof = useSubmitProof();

  async function onSubmitProof(data: SubmissionProof) {
    if (!selectedTask) return;

    const proofString = JSON.stringify(data);

    try {
      return await submitProof({
        boardId,
        taskId: selectedTask.id,
        proof: proofString,
      });
    } catch (error) {
      console.error("Error submitting proof:", error);
      return { error: "Failed to submit proof" };
    }
  }

  const [selfCheckResult, setSelfCheckResult] = useState<{
    isOpen: boolean;
    success: boolean;
    message: string;
    taskId?: bigint;
    signature?: string;
    comment?: string;
  }>({
    isOpen: false,
    success: false,
    message: "",
  });

  const handleSelfCheck = async (task: TaskView) => {
    try {
      const waitToast = toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Verifying your submission...</span>
          </div>
        ),
        duration: Infinity,
      });

      // 验证必要参数
      if (
        !address ||
        !chain ||
        task.completed ||
        task.cancelled ||
        (task.deadline && Number(task.deadline) * 1000 < Date.now())
      ) {
        clearTimeout(waitToast.id);
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: !address
            ? "Please connect your wallet"
            : !chain
            ? "Chain not found"
            : task.completed
            ? "Task is already completed"
            : task.cancelled
            ? "Task is cancelled"
            : "Task deadline has passed",
        });
        return;
      }

      // 获取当前任务的提交证明
      const currentSubmission = userTaskStatuses.find(
        (status) => status.taskId === task.id
      );

      if (!currentSubmission?.submitProof) {
        clearTimeout(waitToast.id);
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "No submission found",
        });
        return;
      }

      // 解析提交的证明数据
      const submissionProof = JSON.parse(currentSubmission.submitProof);

      const taskJson = {
        id: task.id.toString(),
        name: task.name,
        description: task.description,
        rewardAmount: task.rewardAmount.toString(),
        numCompletions: task.numCompletions.toString(),
        maxCompletions: task.maxCompletions.toString(),
        createdAt: task.createdAt.toString(),
        deadline: task.deadline.toString(),
        allowSelfCheck: task.allowSelfCheck,
        reviewers: task.reviewers,
        config: JSON.parse(task.config || "{}"),
      };

      const response = await fetch("/api/self-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId: boardId.toString(),
          boardConfig,
          taskId: task.id.toString(),
          address,
          proof: currentSubmission.submitProof,
          chainName: chain.name,
          task: taskJson,
        }),
      });

      const data = await response.json();

      clearTimeout(waitToast.id);

      if (data.error) {
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "Failed to complete self check",
          taskId: task.id,
          comment: data.error,
        });
        return;
      }

      setSelfCheckResult({
        isOpen: true,
        success: data.signature ? true : false,
        message: data.signature
          ? "Verification successful! You can now claim your reward."
          : "Verification failed",
        taskId: task.id,
        signature: data.signature,
        comment: data.checkData,
      });
    } catch (error) {
      console.error("Self check error:", error);
      toast({
        title: "Error",
        description: "Failed to complete self check",
        variant: "destructive",
      });
      setSelfCheckResult({
        isOpen: true,
        success: false,
        message: "Failed to complete self check",
      });
    }
  };

  const handleClaim = async () => {
    if (
      selfCheckResult.taskId === undefined ||
      !selfCheckResult.signature ||
      !selfCheckResult.comment
    )
      return;

    try {
      const tx = await selfCheckSubmission({
        boardId,
        taskId: selfCheckResult.taskId,
        signature: selfCheckResult.signature as `0x${string}`,
        checkData: selfCheckResult.comment,
      });

      if (tx.error) {
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "Failed to claim reward",
        });
        return;
      }

      setSelfCheckResult((prev) => ({
        ...prev,
        isOpen: false,
      }));

      refetch();
    } catch (error) {
      setSelfCheckResult({
        isOpen: true,
        success: false,
        message: "Failed to claim reward",
      });
    }
  };

  const getTaskStatus = (task: TaskView) => {
    const status = userTaskStatuses.find((status) => status.taskId === task.id);
    return {
      isSubmitted: status?.submitted || false,
      status: status?.status || 0,
      reviewComment: status?.reviewComment || "",
    };
  };

  useEffect(() => {
    const consoleCommands = {
      setDeadline: async (taskId: number, hours: number) => {
        const hoursInMs = hours * 60 * 60 * 1000;
        const newDeadline = Date.now() + hoursInMs;
        setCustomDeadlines((prev) => ({
          ...prev,
          [taskId]: hoursInMs,
        }));
        const task = tasks.find((t) => t.id === BigInt(taskId));
        if (task) {
          task.deadline = BigInt(Math.floor(newDeadline));

          const channelId = boardConfig.channelId;

          if (channelId) {
            try {
              await fetch("/api/discord-announcement", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  channelId,
                  type: "task_deadline_update",
                  data: {
                    taskName: task.name,
                    taskId: taskId.toString(),
                    remainingHours: hours,
                    boardId: boardId.toString(),
                  },
                }),
              });
            } catch (error) {
              console.error("Failed to send Discord notification:", error);
            }
          }
        }
      },
      setCompletions: async (taskId: number, completions: number) => {
        const task = tasks.find((t) => t.id === BigInt(taskId));
        if (task) {
          console.log("task", task);
          task.numCompletions = BigInt(completions);
          const channelId = boardConfig.channelId;
          if (channelId) {
            try {
              fetch("/api/discord-announcement", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  channelId,
                  type: "task_completion_update",
                  data: {
                    taskName: task.name,
                    taskId: taskId.toString(),
                    completions: completions.toString(),
                    maxCompletions: Number(task.maxCompletions),
                    boardId: boardId.toString(),
                  },
                }),
              });
            } catch (error) {
              console.error("Failed to send Discord notification:", error);
            }
          }
        }
      },

      submitProof: async (taskId: number, proof: string) => {
        const task = tasks.find((t) => t.id === BigInt(taskId));
        if (task) {
          try {
            await submitProof({
              boardId,
              taskId: task.id,
              proof,
            });
            refetch();
            return "提交成功";
          } catch (err) {
            return `提交失败: ${err}`;
          }
        }
        return "未找到任务";
      },
    };
    (window as any).taskCommands = consoleCommands;

    return () => {
      delete (window as any).taskCommands;
    };
  }, [tasks, submitProof, refetch, boardId, boardConfig]);


  return (
    <>
      <ul className="space-y-4">
        {tasks.map((task) => {
          const isExpired = Date.now() > Number(task.deadline);
          const remainingTime = Number(task.deadline) - Date.now();
          const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

          return (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative p-6 rounded-xl transition-all duration-200",
                "border border-purple-500/20 bg-black/40 backdrop-blur-sm",
                "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
                "group cursor-pointer"
              )}
            >
              {/* Actions Dropdown */}
              {address && isMember && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 text-purple-300/70 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Submit Proof - 只在未提交或被拒绝时显示 */}
                    {address &&
                      (!getTaskStatus(task).isSubmitted ||
                        getTaskStatus(task).status !== 1) && (
                        <DropdownMenuItem
                          onClick={() => handleOpenSubmitProof(task)}
                        >
                          Submit Proof
                        </DropdownMenuItem>
                      )}

                    {/* Creator Actions */}
                    {isCreatorProp && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onOpenAddReviewerModal(task.id)}
                        >
                          Add Reviewer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onOpenUpdateTaskModal(task.id)}
                        >
                          Update Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelTask(task.id)}>
                          Cancel Task
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Self Check - 只在已提交但未审核时显示 */}
                    {task.allowSelfCheck &&
                      getTaskStatus(task).isSubmitted &&
                      getTaskStatus(task).status === 0 && (
                        <DropdownMenuItem onClick={() => handleSelfCheck(task)}>
                          Self Check
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Task Details */}
              <div
                className="flex items-start"
                onClick={() => onTaskSelect(task)}
              >
                <div className="space-y-3 w-full">
                  <div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-purple-400 bg-clip-text text-transparent">
                      {task.name}
                    </h3>
                    <p className="mt-1 text-sm text-purple-300/70">
                      {task.description}
                    </p>
                  </div>

                  {/* Task Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-purple-300/70">
                      <User2 className="h-4 w-4 text-purple-400" />
                      Creator:
                      <div className="relative w-4 h-4 flex-shrink-0">
                        {userProfiles &&
                        task?.creator &&
                        userProfiles[task.creator.toLowerCase()]?.avatar ? (
                          <Image
                            src={
                              userProfiles[task.creator.toLowerCase()].avatar
                            }
                            alt="Creator avatar"
                            fill
                            className="rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          <User2 className="w-4 h-4" />
                        )}
                      </div>
                      <span>
                        {userProfiles[task.creator.toLowerCase()]?.nickname || (
                          <Address address={task.creator} size="sm" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300/70">
                      <Coins className="h-4 w-4 text-purple-400" />
                      <span>Reward: {formatUnits(task.rewardAmount, 18)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300/70">
                      <UserPlus className="h-4 w-4 text-purple-400" />
                      <span>
                        Completions: {Number(task.numCompletions)}/
                        {Number(task.maxCompletions)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300/70">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span>
                        Created:{" "}
                        {format(new Date(Number(task.createdAt) * 1000), "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300/70">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span>
                        Deadline:{" "}
                        {format(new Date(Number(task.deadline)), "PPP")}
                      </span>
                    </div>
                  </div>

                  {/* Countdown and Status */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-500/10">
                    {/* Status Badges */}
                    <div className="flex gap-2">
                      {task.cancelled && (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/20 text-red-300"
                        >
                          Cancelled
                        </Badge>
                      )}
                      {task.completed && (
                        <Badge className="bg-purple-500/20 text-purple-300">
                          Completed
                        </Badge>
                      )}
                      {getTaskStatus(task).isSubmitted && (
                        <Badge
                          variant={
                            getTaskStatus(task).status === 1
                              ? "success"
                              : getTaskStatus(task).status === -1
                              ? "destructive"
                              : "default"
                          }
                          className={cn(
                            getTaskStatus(task).status === 1 &&
                              "bg-green-500/20 text-green-300",
                            getTaskStatus(task).status === -1 &&
                              "bg-red-500/20 text-red-300",
                            getTaskStatus(task).status === 0 &&
                              "bg-purple-500/20 text-purple-300"
                          )}
                        >
                          {getTaskStatus(task).status === 1
                            ? "Approved"
                            : getTaskStatus(task).status === -1
                            ? "Rejected"
                            : "Pending"}
                        </Badge>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    {!task.cancelled &&
                      !task.completed &&
                      (isExpired ? (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/20 text-red-300"
                        >
                          Expired
                        </Badge>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="text-sm font-medium text-purple-300/70"
                        >
                          {days}d {hours}h {minutes}m {seconds}s
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {selectedTask && (
        <SubmitProofModal
          isOpen={isSubmitProofModalOpen}
          onClose={() => {
            setIsSubmitProofModalOpen(false);
            setSelectedTask(null);
          }}
          taskConfig={JSON.parse(selectedTask.config)}
          onSubmit={onSubmitProof}
          onConfirmed={refetch}
        />
      )}

      {/* Self Check Result Modal */}
      {selfCheckResult.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              {selfCheckResult.success ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Success!
                  </h3>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Error
                  </h3>
                </>
              )}

              <p className="text-center text-muted-foreground">
                {selfCheckResult.message}
              </p>

              {selfCheckResult.comment && (
                <>
                  <h3 className="text-sm text-muted-foreground text-left font-bold w-full">
                    Comment:
                  </h3>
                  <Textarea
                    value={selfCheckResult.comment}
                    className="w-full"
                    disabled
                  />
                </>
              )}

              <div className="flex gap-2 mt-4">
                {selfCheckResult.success ? (
                  <Button onClick={handleClaim}>Claim Reward</Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelfCheckResult((prev) => ({ ...prev, isOpen: false }))
                  }
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
