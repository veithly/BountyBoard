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
import { Check, X, Eye, Circle, CheckCircle } from "lucide-react";
import {
  BoardDetailView,
  TaskView,
  SubmissionView,
  SubmissionProof,
} from "@/types/types";
import { Address } from "./ui/Address";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface MemberSubmissionTableProps {
  board: BoardDetailView;
  address: `0x${string}` | undefined;
  onOpenReviewSubmissionModal: (
    submission: SubmissionView,
    task: TaskView
  ) => void;
}

export default function MemberSubmissionTable({
  board,
  address,
  onOpenReviewSubmissionModal,
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

  const renderProofContent = (proof: string) => {
    try {
      console.log("proof", proof);
      const proofData: SubmissionProof = JSON.parse(proof);
      return (
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {proofData.text && <TabsTrigger value="text">Text</TabsTrigger>}
            {proofData.image && <TabsTrigger value="image">Image</TabsTrigger>}
            {proofData.github && (
              <TabsTrigger value="github">GitHub</TabsTrigger>
            )}
            {proofData.contract && (
              <TabsTrigger value="contract">Contract</TabsTrigger>
            )}
            {proofData.xPost && <TabsTrigger value="xPost">X Post</TabsTrigger>}
            {proofData.discordId && (
              <TabsTrigger value="discord">Discord</TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4">
            {proofData.text && (
              <TabsContent value="text">
                <Textarea
                  value={proofData.text}
                  readOnly
                  className="min-h-[100px]"
                />
              </TabsContent>
            )}

            {proofData.image && (
              <TabsContent value="image">
                <div className="relative w-full h-[300px]">
                  <Image
                    src={proofData.image}
                    alt="Proof"
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              </TabsContent>
            )}

            {proofData.github && (
              <TabsContent value="github">
                <a
                  href={proofData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
                    />
                  </svg>
                  View Pull Request
                </a>
              </TabsContent>
            )}

            {proofData.contract && (
              <TabsContent value="contract">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="font-mono break-all">{proofData.contract}</p>
                </div>
              </TabsContent>
            )}

            {proofData.xPost && (
              <TabsContent value="xPost">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p>{proofData.xPost}</p>
                </div>
              </TabsContent>
            )}

            {proofData.discordId && (
              <TabsContent value="discord">
                <div className="p-4 bg-gray-50 rounded-md flex items-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#5865F2"
                      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
                    />
                  </svg>
                  <span>Discord ID: {proofData.discordId}</span>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      );
    } catch (e) {
      // 如果解析失败，显示原始文本
      return (
        <Textarea
          value={proof}
          readOnly
          className="mt-2 resize-none bg-gray-50 min-h-[100px]"
        />
      );
    }
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
                if (submission && isReviewer && submission.reviewed === 0) {
                  submissionIcon = (
                    <Eye
                      className="h-5 w-5 text-blue-500 cursor-pointer"
                      onClick={() =>
                        onOpenReviewSubmissionModal(submission, task)
                      }
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

      {/* Submission Details Modal */}
      <Dialog open={isSubmissionModalOpen} onOpenChange={closeSubmissionModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted by:{" "}
              <Address address={selectedSubmission?.submitter || "0x0"} />
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Task:</span>{" "}
                  {
                    board.tasks.find((t) => t.id === selectedSubmission.taskId)
                      ?.name
                  }
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={
                      selectedSubmission.status === 1
                        ? "text-green-500"
                        : selectedSubmission.status === -1
                        ? "text-red-500"
                        : "text-yellow-500"
                    }
                  >
                    {selectedSubmission.status === 1
                      ? "Approved"
                      : selectedSubmission.status === -1
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {selectedSubmission.reviewComment && (
                <div>
                  <span className="font-semibold">Review Comment:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedSubmission.reviewComment}
                  </p>
                </div>
              )}

              <div>
                <span className="font-semibold">Proof:</span>
                <div className="mt-2">
                  {renderProofContent(selectedSubmission.proof)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
