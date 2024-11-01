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
import { formatUnits } from 'viem';
import { TaskView } from '@/types/types';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

interface TaskListProps {
  tasks: TaskView[];
  address: `0x${string}` | undefined;
  onTaskSelect: (task: TaskView) => void;
  onOpenSubmitProofModal: (taskId: bigint) => void;
  onOpenAddReviewerModal: (taskId: bigint) => void;
  onOpenUpdateTaskModal: (taskId: bigint) => void;
  onCancelTask: (taskId: bigint) => void;
}

export default function TaskList({
  tasks,
  address,
  onTaskSelect,
  onOpenSubmitProofModal,
  onOpenAddReviewerModal,
  onOpenUpdateTaskModal,
  onCancelTask
}: TaskListProps) {

  const isCreator = tasks.some(task => task.creator.toLowerCase() === address?.toLowerCase());
  const [remainingTimes, setRemainingTimes] = useState<Record<number, number>>(
    tasks.reduce((acc, task) => ({ ...acc, [Number(task.id)]: Number(task.deadline) - Date.now() }), {})
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

  return (
    <ul className="space-y-4">
      {tasks.map((task) => {
        const isExpired = Date.now() > Number(task.deadline);
        const remainingTime = Number(task.deadline) - Date.now();
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
                  {/* Submit Proof */}
                  {address && (
                    <DropdownMenuItem onClick={() => onOpenSubmitProofModal(task.id)}>
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
                  Deadline: {format(new Date(Number(task.deadline)), 'PPP')}
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
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}