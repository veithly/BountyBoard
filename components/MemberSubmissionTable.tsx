'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface MemberSubmissionTableProps {
  members: any[];
  bounties: any[];
  submissionsByMemberAndBounty: any;
  onOpenReviewSubmissionModal: (bountyId: string, submission: any) => void;
}

export default function MemberSubmissionTable({
  members,
  bounties,
  submissionsByMemberAndBounty,
  onOpenReviewSubmissionModal,
}: MemberSubmissionTableProps) {
  return (
    <Table>
      <TableCaption>Member Submission Status</TableCaption>
      <TableHeader>
        <TableRow>
          <TableCell className="font-bold">Member</TableCell>
          {bounties.map((bounty) => (
            <TableCell key={bounty.id} className="font-bold">{bounty.description}</TableCell>
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
                    <>
                      <p>Submitted</p>
                      <Button onClick={() => onOpenReviewSubmissionModal(bounty.id, submission)}>Review</Button>
                    </>
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
