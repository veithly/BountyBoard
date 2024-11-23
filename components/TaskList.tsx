'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  Clock,
  Coins,
  MoreHorizontal,
  User2,
  UserPlus
} from 'lucide-react'
import { format } from 'date-fns';
import { Address } from './ui/Address';
import { Chain, formatUnits } from 'viem';
import { TaskView, SubmissionProof, UserTaskStatus } from '@/types/types';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import SubmitProofModal from './SubmitProofModal';
import { useSubmitProof, useSelfCheckSubmission } from '@/hooks/useContract';
import { useToast } from './ui/use-toast';

interface TaskListProps {
  boardId: bigint;
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
}

export default function TaskList({
  boardId,
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
}: TaskListProps) {
  // console.log("Tasks:", tasks);
  const { toast } = useToast();
  const selfCheckSubmission = useSelfCheckSubmission();

  const isCreator = tasks.some(task => task.creator.toLowerCase() === address?.toLowerCase());
  const [remainingTimes, setRemainingTimes] = useState<Record<number, number>>(
    tasks.reduce((acc, task) => ({
      ...acc,
      [Number(task.id)]: (Number(task.deadline) * 1000) - Date.now()
    }), {})
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTimes(prevTimes =>
        tasks.reduce((acc, task) => ({
          ...acc,
          [Number(task.id)]: prevTimes[Number(task.id)] > 0 ? prevTimes[Number(task.id)] - 1000 : 0
        }), {})
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, [tasks]);

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
        proof: proofString
      });
    } catch (error) {
      console.error("Error submitting proof:", error);
      return { error: "Failed to submit proof" };
    }
  }

  const handleSelfCheck = async (task: TaskView) => {
    // 显示加载中的 Toast
    toast({
      title: "Processing",
      description: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span>Verifying your submission...</span>
        </div>
      ),
    });

    try {
      // 验证必要参数
      if (!address) {
        toast({
          title: "Error",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }

      if (!chain) {
        toast({
          title: "Error",
          description: "Chain not found",
          variant: "destructive",
        });
        return;
      }

      if (task.completed) {
        toast({
          title: "Error",
          description: "Task is already completed",
          variant: "destructive",
        });
        return;
      }

      if (task.cancelled) {
        toast({
          title: "Error",
          description: "Task is cancelled",
          variant: "destructive",
        });
        return;
      }

      if (task.deadline && Number(task.deadline) * 1000 < Date.now()) {
        toast({
          title: "Error",
          description: "Task deadline has passed",
          variant: "destructive",
        });
        return;
      }

      // Call API to get signature
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Getting verification signature...</span>
          </div>
        ),
      });

      const response = await fetch('/api/self-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: boardId.toString(),
          taskId: task.id.toString(),
          address,
          proof: userTaskStatuses.find(status => status.taskId === task.id)?.submitProof,
          chainName: chain.name
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Submit to contract with signature
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Waiting for transaction confirmation...</span>
          </div>
        ),
      });

      const tx = await selfCheckSubmission({
        boardId,
        taskId: task.id,
        signature: data.signature,
        checkData: data.checkData
      });

      if (tx.error) {
        toast({
          title: "Error",
          description: tx.error,
          variant: "destructive",
        });
        return;
      }

      // 成功状态
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-green-500"
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
            <span>Self check completed successfully</span>
          </div>
        ),
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2 text-destructive">
            <svg
              className="h-4 w-4"
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
            <span>{error instanceof Error ? error.message : "Failed to complete self check"}</span>
          </div>
        ),
        variant: "destructive",
      });
    }
  };

  const getTaskStatus = (task: TaskView) => {
    const status = userTaskStatuses.find(status => status.taskId === task.id);
    return {
      isSubmitted: status?.submitted || false,
      status: status?.status || 0,
      reviewComment: status?.reviewComment || ''
    };
  };

  return (
    <>
      <ul className="space-y-4">
        {tasks.map((task) => {
          const isExpired = Date.now() > Number(task.deadline) * 1000;
          const remainingTime = (Number(task.deadline) * 1000) - Date.now();
          const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

          return (
            <li key={task.id} className="relative card mb-4 p-4 shadow-lg rounded-lg border border-gray-200">
              {/* Actions Dropdown */}
              {address && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="absolute top-4 right-4">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Submit Proof - 只在未提交或被拒绝时显示 */}
                    {address && (!getTaskStatus(task).isSubmitted || getTaskStatus(task).status !== 1) && (
                      <DropdownMenuItem onClick={() => handleOpenSubmitProof(task)}>
                        Submit Proof
                      </DropdownMenuItem>
                    )}

                    {/* Creator Actions */}
                    {isCreator && (
                      <>
                        <DropdownMenuItem onClick={() => onOpenAddReviewerModal(task.id)}>
                          Add Reviewer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenUpdateTaskModal(task.id)}>
                          Update Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCancelTask(task.id)}>
                          Cancel Task
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Self Check - 只在已提交但未审核时显示 */}
                    {task.allowSelfCheck && getTaskStatus(task).isSubmitted && getTaskStatus(task).status === 0 && (
                      <DropdownMenuItem onClick={() => handleSelfCheck(task)}>
                        Self Check
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Task Details */}
              <div className="flex items-start cursor-pointer" onClick={() => onTaskSelect(task)}>
                <div>
                  <h3 className="font-bold">{task.name}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <User2 className="h-4 w-4" />
                    <Address address={task.creator} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    Reward: {formatUnits(task.rewardAmount, 18)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    Completions: {Number(task.numCompletions)}/{Number(task.maxCompletions)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created: {format(new Date(Number(task.createdAt) * 1000), 'PPP')}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Deadline: {format(new Date(Number(task.deadline) * 1000), 'PPP')}
                  </div>
                </div>

                {/* Countdown and Status */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end text-xs text-muted-foreground">
                  {!task.cancelled && !task.completed && (
                    isExpired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      >
                        {days}d {hours}h {minutes}m {seconds}s
                      </motion.div>
                    )
                  )}

                  {/* Task Status */}
                  <div className="mt-2">
                    {task.cancelled && (
                      <Badge variant="destructive">Cancelled</Badge>
                    )}
                    {task.completed && (
                      <Badge>Completed</Badge>
                    )}
                    {getTaskStatus(task).isSubmitted && (
                      <Badge variant={
                        getTaskStatus(task).status === 1 ? "success" :
                        getTaskStatus(task).status === -1 ? "destructive" :
                        "default"
                      }>
                        {getTaskStatus(task).status === 1 ? "Approved" :
                         getTaskStatus(task).status === -1 ? "Rejected" :
                         "Pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </li>
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
    </>
  );
}