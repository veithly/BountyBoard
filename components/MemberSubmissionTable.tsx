// components/MemberSubmissionTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye, Circle, CheckCircle, ExternalLink, User2 } from "lucide-react";
import {
  BoardDetailView,
  TaskView,
  SubmissionView,
} from "@/types/types";
import { Address } from "./ui/Address";
import { useState } from "react";
import SubmissionDetailsModal from "./SubmissionDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MemberSubmissionTableProps {
  board: BoardDetailView;
  address: `0x${string}` | undefined;
  refetch: () => void;
  userProfiles: Record<string, { nickname: string; avatar: string; }>;
}

export default function MemberSubmissionTable({
  board,
  address,
  refetch,
  userProfiles,
}: MemberSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionView | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);

  const handleSubmissionClick = (submission: SubmissionView, task: TaskView) => {
    console.log(submission, task);

    if (submission.submitter !== "0x0000000000000000000000000000000000000000") {
      setSelectedSubmission(submission);
      setSelectedTask(task);
      setSelectedTaskId(task.id);
      setIsSubmissionModalOpen(true);
    }
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setSelectedSubmission(null);
    setSelectedTask(null);
    setSelectedTaskId(null);
  };

  return (
    <>
      {/* Legend */}
      <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-black/40 backdrop-blur-sm">
        <h4 className="text-sm font-medium text-purple-200 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs text-purple-300/70">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-yellow-400/80" />
            <span>Not Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400/80" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500/80" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-400/80" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400/80" />
            <span>Need Review</span>
          </div>
        </div>
      </div>

      <Table>
        <TableCaption className="text-purple-300/60">
          Member Submission Status
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableCell className="font-medium text-purple-100">Member</TableCell>
            {board.tasks.map((task) => (
              <TableCell key={task.id} className="font-medium text-purple-100">
                {task.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.members.map((member, memberIndex) => (
            <TableRow key={member} className="hover:bg-purple-500/5 transition-colors duration-200">
              <TableCell className="font-medium text-purple-200">
                <div className="flex items-center gap-2">
                  {userProfiles[member.toLowerCase()]?.avatar ? (
                    <Image
                      src={userProfiles[member.toLowerCase()].avatar}
                      alt="Member"
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
                    {userProfiles[member.toLowerCase()]?.nickname || (
                      <Address address={member} size="lg" />
                    )}
                  </span>
                </div>
              </TableCell>
              {board.tasks.map((task, taskIndex) => {
                const submission = board.submissions[taskIndex][memberIndex];
                const isReviewer = task.reviewers.some(
                  (reviewer: `0x${string}`) => reviewer.toLowerCase() === address?.toLowerCase()
                );

                let icon = {
                  component: Circle,
                  className: "text-yellow-400/80 hover:text-yellow-400"
                };

                if (submission.submitter !== "0x0000000000000000000000000000000000000000") {
                  if (submission.status === 1) {
                    icon = {
                      component: Check,
                      className: "text-green-500/80 hover:text-green-500"
                    };
                  } else if (submission.status === -1) {
                    icon = {
                      component: X,
                      className: "text-red-400/80 hover:text-red-400"
                    };
                  } else if (isReviewer && submission.status === 0) {
                    icon = {
                      component: Eye,
                      className: "text-blue-400/80 hover:text-blue-400"
                    };
                  } else {
                    icon = {
                      component: CheckCircle,
                      className: "text-green-400/80 hover:text-green-400"
                    };
                  }
                }

                const IconComponent = icon.component;

                return (
                  <TableCell key={task.id}>
                    <IconComponent
                      className={cn(
                        "h-5 w-5 cursor-pointer transition-colors duration-200",
                        icon.className
                      )}
                      onClick={() => handleSubmissionClick(submission, task)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SubmissionDetailsModal
        isOpen={isSubmissionModalOpen}
        onClose={closeSubmissionModal}
        submission={selectedSubmission}
        boardId={board.id}
        task={selectedTask}
        isReviewer={selectedTask?.reviewers.some(
          (reviewer: `0x${string}`) => reviewer.toLowerCase() === address?.toLowerCase()
        ) || false}
        onConfirmed={refetch}
      />
    </>
  );
}
