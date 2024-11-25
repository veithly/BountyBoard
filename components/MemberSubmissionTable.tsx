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
import { Check, X, Eye, Circle, CheckCircle, ExternalLink } from "lucide-react";
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
}

export default function MemberSubmissionTable({
  board,
  address,
  refetch,
}: MemberSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionView | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const handleSubmissionClick = (submission: SubmissionView | undefined) => {
    if (submission) {
      setSelectedSubmission(submission);
      setIsSubmissionModalOpen(true);
    }
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setSelectedSubmission(null);
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
              <TableCell
                key={task.id}
                className="font-medium text-purple-100"
              >
                {task.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.members.map((member) => (
            <TableRow
              key={member}
              className="hover:bg-purple-500/5 transition-colors duration-200"
            >
              <TableCell className="font-medium text-purple-200">
                <Address address={member} size="lg" />
              </TableCell>
              {board.tasks.map((task: TaskView) => {
                const submission = board.submissions.find(
                  (sub: SubmissionView) =>
                    sub.submitter === member && sub.taskId === task.id
                );

                let icon = {
                  component: Circle,
                  className: "text-yellow-400/80 hover:text-yellow-400"
                };

                if (submission) {
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
                      onClick={() => handleSubmissionClick(submission)}
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
        task={selectedSubmission ? board.tasks.find((t) => t.id === selectedSubmission.taskId) || null : null}
        isReviewer={selectedSubmission ? board.tasks.find((t) => t.id === selectedSubmission.taskId)?.reviewers.some(
          (reviewer: `0x${string}`) => reviewer.toLowerCase() === address?.toLowerCase()
        ) || false : false}
        onConfirmed={refetch}
      />
    </>
  );
}
