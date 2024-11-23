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
      {/* 符号说明 */}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <div>
          <Circle className="h-4 w-4 text-yellow-400 inline-block mr-1 align-middle" />{" "}
          Not Submitted
        </div>
        <div>
          <CheckCircle className="h-4 w-4 text-green-300 inline-block mr-1 align-middle" />{" "}
          Submitted
        </div>
        <div>
          <Check className="h-4 w-4 text-green-500 inline-block mr-1 align-middle" />{" "}
          Approved
        </div>
        <div>
          <X className="h-4 w-4 text-red-500 inline-block mr-1 align-middle" />{" "}
          Rejected
        </div>
        <div>
          <Eye className="h-4 w-4 text-blue-500 inline-block mr-1 align-middle" />{" "}
          Need Review
        </div>
      </div>
      <Table>
        <TableCaption>Member Submission Status</TableCaption>
        <TableHeader>
          <TableRow>
            <TableCell className="font-bold">Member</TableCell>
            {board.tasks.map((task) => (
              <TableCell key={task.id} className="font-bold">
                {task.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.members.map((member) => (
            <TableRow key={member}>
              <TableCell className="font-medium">
                <Address address={member} size="lg" />
              </TableCell>
              {board.tasks.map((task: TaskView) => {
                const submission = board.submissions.find(
                  (sub: SubmissionView) =>
                    sub.submitter === member && sub.taskId === task.id
                );

                let submissionIcon = (
                  <Circle
                    className="h-5 w-5 text-yellow-400 cursor-pointer"
                    onClick={() => handleSubmissionClick(submission)}
                  />
                );

                if (submission) {
                  submissionIcon = (
                    <CheckCircle
                      className="h-5 w-5 text-green-300 cursor-pointer"
                      onClick={() => handleSubmissionClick(submission)}
                    />
                  );
                }
                const isReviewer = task.reviewers.some(
                  (reviewer: `0x${string}`) =>
                    reviewer.toLowerCase() === address?.toLowerCase()
                );
                if (submission && isReviewer && submission.status === 0) {
                  submissionIcon = (
                    <Eye
                      className="h-5 w-5 text-blue-500 cursor-pointer"
                      onClick={() => handleSubmissionClick(submission)}
                    />
                  );
                } else if (submission && submission.status === 1) {
                  submissionIcon = (
                    <Check
                      className="h-5 w-5 text-green-500 cursor-pointer"
                      onClick={() => handleSubmissionClick(submission)}
                    />
                  );
                } else if (submission && submission.status === -1) {
                  submissionIcon = (
                    <X
                      className="h-5 w-5 text-red-500 cursor-pointer"
                      onClick={() => handleSubmissionClick(submission)}
                    />
                  );
                }

                return <TableCell key={task.id}>{submissionIcon}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 替换原有的 Dialog 为新的 SubmissionDetailsModal */}
      <SubmissionDetailsModal
        isOpen={isSubmissionModalOpen}
        onClose={closeSubmissionModal}
        submission={selectedSubmission}
        boardId={board.id}
        task={
          selectedSubmission
            ? board.tasks.find((t) => t.id === selectedSubmission.taskId) ||
              null
            : null
        }
        isReviewer={
          selectedSubmission
            ? board.tasks
                .find((t) => t.id === selectedSubmission.taskId)
                ?.reviewers.some(
                  (reviewer: `0x${string}`) =>
                    reviewer.toLowerCase() === address?.toLowerCase()
                ) || false
            : false
        }
        onConfirmed={refetch}
      />
    </>
  );
}
