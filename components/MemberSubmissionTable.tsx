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

interface MemberSubmissionTableProps {
  members: any[];
  bounties: any[];
  submissions: any[];
  onOpenReviewSubmissionModal: (submission: any) => void;
}

export default function MemberSubmissionTable({ members, bounties, submissions, onOpenReviewSubmissionModal }: MemberSubmissionTableProps) {

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
              const submission = submissionsByMemberAndBounty[member.member]?.[bounty.id];
              return (
                <TableCell key={bounty.id}>
                  {submission ? (
                    <Button
                      variant="link"
                      onClick={() => onOpenReviewSubmissionModal(submission)}
                    >
                      {submission.reviewed ? "Reviewed" : "Pending Review"}
                    </Button>
                  ) : (
                    "Not Submitted"
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
