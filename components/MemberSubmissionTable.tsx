// components/MemberSubmissionTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Board, Bounty, Member, Reviewer, Submission } from '@/types/types';
import { Address } from './ui/Address';

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
  return (
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
            <TableCell className="font-medium"><Address address={member.member} size='lg' /></TableCell>
            {board.bounties.map((bounty: Bounty) => {
              const submission = bounty.submissions.find((submission: Submission) => submission.submitter === member.member);

              return (
                <TableCell key={bounty.id}>
                  {submission ? (
                    submission.reviewed ? (
                      submission.approved ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )
                    ) : (
                      // Only show "Pending Review" button if the user is a reviewer
                      bounty.reviewers.some(
                        (reviewer: Reviewer) =>
                          reviewer.reviewerAddress.toLowerCase() === address?.toLowerCase()
                      ) ? (
                        <Button
                          variant="link"
                          onClick={() => onOpenReviewSubmissionModal(submission, bounty)}
                        >
                          Pending Review
                        </Button>
                      ) : (
                        'Not Reviewed'
                      )
                    )
                  ) : (
                    'Not Submitted'
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}