// components/MemberSubmissionTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Eye, Circle, CheckCircle } from 'lucide-react'; // 导入新的图标
import { Board, Bounty, Member, Reviewer, Submission } from '@/types/types';
import { Address } from './ui/Address';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface MemberSubmissionTableProps {
  board: Board;
  address: string | undefined;
  onOpenReviewSubmissionModal: (submission: Submission, bounty: Bounty) => void;
}

export default function MemberSubmissionTable({
  board,
  address,
  onOpenReviewSubmissionModal,
}: MemberSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const handleSubmissionClick = (submission: Submission | undefined) => {
    if (submission) {
      setSelectedSubmission(submission);
      setIsSubmissionModalOpen(true);
    }
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setSelectedSubmission(null);
  };

  const isReviewer = board.bounties.some(bounty =>
    bounty.reviewers.some((reviewer: Reviewer) =>
      reviewer.reviewerAddress.toLowerCase() === address?.toLowerCase()
    )
  );

  return (
    <>
      {/* 符号说明 */}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <div>
          <Circle className="h-4 w-4 text-yellow-400 inline-block mr-1 align-middle" /> Not Submitted
        </div>
        <div>
          <CheckCircle className="h-4 w-4 text-green-300 inline-block mr-1 align-middle" /> Submitted
        </div>
        <div>
          <Check className="h-4 w-4 text-green-500 inline-block mr-1 align-middle" /> Approved
        </div>
        <div>
          <X className="h-4 w-4 text-red-500 inline-block mr-1 align-middle" /> Rejected
        </div>
        {isReviewer && (
          <div>
            <Eye className="h-4 w-4 text-blue-500 inline-block mr-1 align-middle" /> Need Review
          </div>
        )}
      </div>
      <Table>
        <TableCaption>Member Submission Status</TableCaption>
        <TableHeader>
          <TableRow>
            <TableCell className="font-bold">Member</TableCell>
            {board.bounties.map((bounty) => (
              <TableCell key={bounty.id} className="font-bold">
                {bounty.description}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.members.map((member: Member) => (
            <TableRow key={member.member}>
              <TableCell className="font-medium">
                <Address address={member.member} size='lg' />
              </TableCell>
              {board.bounties.map((bounty: Bounty) => {
                const submission = bounty.submissions.find(
                  (submission: Submission) => submission.submitter === member.member
                );

                let submissionIcon = (
                  <Circle className="h-5 w-5 text-yellow-400 cursor-pointer" onClick={() => handleSubmissionClick(submission)} />
                ); // 默认显示黄色圆圈

                if (submission) {
                  submissionIcon = (
                    <CheckCircle className="h-5 w-5 text-green-300 cursor-pointer" onClick={() => handleSubmissionClick(submission)} />
                  )
                }
                // 仅当提交存在且用户是审核员时才显示蓝色眼睛
                if (submission && isReviewer && !submission.reviewed) {
                  submissionIcon = (
                    <Eye className="h-5 w-5 text-blue-500 cursor-pointer" onClick={() => onOpenReviewSubmissionModal(submission, bounty)} />
                  );
                } else if (submission && submission.reviewed) { // 如果提交已审核，则显示审核结果图标
                  submissionIcon = submission.approved ? (
                    <Check className="h-5 w-5 text-green-500 cursor-pointer" onClick={() => handleSubmissionClick(submission)} />
                  ) : (
                    <X className="h-5 w-5 text-red-500 cursor-pointer" onClick={() => handleSubmissionClick(submission)} />
                  );
                }

                return (
                  <TableCell key={bounty.id}>
                    {submissionIcon}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Submission Details Modal */}
      <Dialog open={isSubmissionModalOpen} onOpenChange={closeSubmissionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted by: <Address address={selectedSubmission?.submitter || '0x0'} />
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="mt-4">
              <p className="font-bold">Proof:</p>
              <p>{selectedSubmission.proof}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
