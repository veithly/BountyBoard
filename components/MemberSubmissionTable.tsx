// components/MemberSubmissionTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface MemberSubmissionTableProps {
  members: any[];
  bounties: any[];
  submissions: any[];
  onOpenReviewSubmissionModal: (submission: any) => void;
  address: string | undefined;
}

export default function MemberSubmissionTable({ members, bounties, submissions, address,onOpenReviewSubmissionModal }: MemberSubmissionTableProps) {

  // Create a mapping to easily find submissions by submitter and bounty ID
  const submissionsByMemberAndBounty = submissions.reduce((acc, submission) => {
    const memberId = submission.submitter;
    const bountyId = submission.bounty.id;
    acc[memberId] = acc[memberId] || {};
    acc[memberId][bountyId] = submission;
    return acc;
  }, {});

  return (
    <Table>
      <TableCaption>Member Submission Status</TableCaption>
      <TableHeader>
        <TableRow>
          <TableCell className="font-bold">Member</TableCell>
          {bounties.map((bounty) => (
            <TableCell key={bounty.id} className="font-bold">
              {bounty.description}
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.member}>
            <TableCell className="font-medium">{member.member}</TableCell>
            {bounties.map((bounty) => {
              const submission =
                submissionsByMemberAndBounty[member.member]?.[bounty.id];
              console.log(submission, address, bounty);
              return (
                <TableCell key={bounty.id}>
                  { 
                  submission ? (
                    submission.reviewed ? (
                      submission.approved ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )
                    ) : (
                      // Only show "Pending Review" button if the user is a reviewer
                      bounty.reviewers.includes(address?.toLowerCase()) ? ( 
                        <Button
                          variant="link"
                          onClick={() => onOpenReviewSubmissionModal(submission)}
                        >
                          Pending Review
                        </Button>
                      ) : (
                        'Pending Review'
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
