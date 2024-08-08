'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import DynamicModal from '@/components/DynamicModal';
import { useState } from 'react';
import BountyList from '@/components/BountyList';
import MemberSubmissionTable from '@/components/MemberSubmissionTable';
import { useCreateBounty, useSubmitProof, useReviewSubmission } from '@/utils/contract';

const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://api.studio.thegraph.com/query/82957/bounty-board/version/latest';

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { address } = useAccount();
  const { data } = useQuery({
    queryKey: ['board', boardId],
    async queryFn() {
      const boardQuery = gql`
        query BoardDetails($boardId: ID!) {
          board(id: $boardId) {
            id
            creator
            name
            description
            bounties {
              id
              description
              creator
              deadline
              maxCompletions
              numCompletions
              rewardAmount
              createdAt
            }
            members {
              member
            }
          }
        }
      `;

      const submissionsQuery = gql`
        query SubmissionsForBoard($boardId: ID!) {
          submissions(where: { bounty_: { board: $boardId } }) {
            id
            bounty {
              id
            }
            submitter
            proof
            reviewed
            approved
            submittedAt
          }
        }
      `;

      const boardData = await request(url, boardQuery, { boardId });
      const submissionsData = await request(url, submissionsQuery, { boardId });
      console.log('boardData', boardData);
      console.log('submissionsData', submissionsData);
      return {
        board: boardData.board,
        submissions: submissionsData.submissions,
      };
    },
  });

  if (!data?.board) {
    return <div>Loading...</div>;
  }

  const board = data.board;
  const submissions = data.submissions;

  return (
    <div className="container mx-auto p-4">
      <BoardDetails board={board} submissions={submissions} address={address} />
    </div>
  );
}

function BoardDetails({ board, submissions, address }: { board: any; submissions: any[]; address: string | undefined }) {
  const createBounty = useCreateBounty();
  const submitProof = useSubmitProof();
  const reviewSubmission = useReviewSubmission();

  const modalConfigs = {
    addBounty: {
      title: 'Add Bounty',
      description: 'Create a new bounty with a description, deadline, max completions, and reward amount.',
      fields: [
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'deadline', label: 'Deadline', type: 'date' },
        { name: 'maxCompletions', label: 'Max Completions', type: 'number' },
        { name: 'rewardAmount', label: 'Reward Amount', type: 'number' },
      ],
      onSubmit: async (data: any, boardId: string) => {
        try {
          await createBounty({
            boardId: parseInt(boardId),
            description: data.description,
            deadline: data.deadline,
            maxCompletions: data.maxCompletions,
            rewardAmount: data.rewardAmount,
          });
          // Handle success, e.g., show a success message or refresh the page
          console.log('Bounty created successfully!');
        } catch (error) {
          // Handle error, e.g., show an error message
          console.error('Error creating bounty:', error);
        }
      },
    },
    submitProof: {
      title: 'Submit Proof',
      description: 'Submit your proof of completion for this bounty.',
      fields: [
        { name: 'proof', label: 'Proof', type: 'text' },
      ],
      onSubmit: async (data: any, boardId: string, bountyId: string) => {
        try {
          await submitProof({
            boardId: parseInt(boardId),
            bountyId: parseInt(bountyId!), // bountyId should be defined here
            proof: data.proof,
          });
          // Handle success
          console.log('Proof submitted successfully!');
        } catch (error) {
          // Handle error
          console.error('Error submitting proof:', error);
        }
      },
    },
    reviewSubmission: {
      title: 'Review Submission',
      description: 'Review the submitted proof and decide whether to approve or reject it.',
      fields: [
        { name: 'approved', label: 'Approve', type: 'checkbox' },
      ],
      onSubmit: async (data: any, boardId: string, bountyId: string, submissionIndex: number) => {
        try {
          await reviewSubmission({
            boardId: parseInt(boardId),
            bountyId: parseInt(bountyId!), // bountyId should be defined here
            submissionIndex,
            approved: data.approved,
          });
          // Handle success
          console.log('Submission reviewed successfully!');
        } catch (error) {
          // Handle error
          console.error('Error reviewing submission:', error);
        }
      },
    },
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<keyof typeof modalConfigs | null>(null);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);

  const isCreator = address?.toLowerCase() === board.creator;

  // Create a mapping of submissions by member and bounty ID
  const submissionsByMemberAndBounty = submissions.reduce((acc, submission) => {
    const memberId = submission.submitter;
    const bountyId = submission.bounty.id;
    acc[memberId] = acc[memberId] || {};
    acc[memberId][bountyId] = submission; // Store the entire submission object
    return acc;
  }, {});

  const handleOpenModal = (type: keyof typeof modalConfigs, bountyId?: string) => {
    setModalType(type);
    setSelectedBountyId(bountyId || null);
    setIsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{board.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{board.description}</p>

        {isCreator && (
          <Button onClick={() => handleOpenModal('addBounty')}>Add Bounty</Button>
        )}

        <h2 className="text-xl font-bold mb-2 mt-4">Bounties</h2>
        <BountyList
          bounties={board.bounties}
          address={address}
          onOpenSubmitProofModal={(bountyId) => handleOpenModal('submitProof', bountyId)}
        />

        <h2 className="text-xl font-bold mb-2 mt-4">Members and Submissions</h2>
        <MemberSubmissionTable
          members={board.members}
          bounties={board.bounties}
          submissionsByMemberAndBounty={submissionsByMemberAndBounty}
          onOpenReviewSubmissionModal={(bountyId, submission) => handleOpenModal('reviewSubmission', bountyId)}
        />

        {modalType && (
          <DynamicModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            config={modalConfigs[modalType]}
            boardId={board.id}
            bountyId={selectedBountyId}
          />
        )}
      </CardContent>
    </Card>
  );
}
