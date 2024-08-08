'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

// Components
import BountyList from '@/components/BountyList';
import MemberSubmissionTable from '@/components/MemberSubmissionTable';
import DynamicModal from '@/components/DynamicModal';
import BoardActionsDropdown from '@/components/BoardActionsDropdown';

// Contract Hooks & ABI
import {
  useCreateBounty,
  useSubmitProof,
  useReviewSubmission,
  useAddReviewerToBounty,
  useCancelBounty,
  useCloseBoard,
  useWithdrawPledgedTokens,
  useUpdateBountyBoard,
  useJoinBoard,
  usePledgeTokens,
  useUpdateBounty, 
  useTokenSymbol} from '@/utils/contract';

// GraphQL and Contract Addresses
const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://api.studio.thegraph.com/query/82957/bounty-board/version/latest';
const contractAddress = process.env.NEXT_PUBLIC_BOUNTY_BOARD_CONTRACT_ADDRESS as `0x${string}`;

// Modal Configurations
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
  },
  submitProof: {
    title: 'Submit Proof',
    description: 'Submit your proof of completion for this bounty.',
    fields: [{ name: 'proof', label: 'Proof', type: 'text' }],
  },
  reviewSubmission: {
    title: 'Review Submission',
    description: 'Review the submitted proof and decide whether to approve or reject it.',
    fields: [{ name: 'approved', label: 'Approve', type: 'checkbox' }],
  },
  addReviewer: {
    title: 'Add Reviewer',
    description: 'Add a reviewer to this bounty.',
    fields: [{ name: 'reviewer', label: 'Reviewer Address', type: 'text' }],
  },
  updateBoard: {
    title: 'Update Board',
    description: 'Update the board name, description, and reward token.',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'rewardToken', label: 'Reward Token Address', type: 'text' },
    ],
  },
  updateBounty: {
    title: 'Update Bounty',
    description: 'Update the bounty description, deadline, max completions, and reward amount.',
    fields: [
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'deadline', label: 'Deadline', type: 'date' },
      { name: 'maxCompletions', label: 'Max Completions', type: 'number' },
      { name: 'rewardAmount', label: 'Reward Amount', type: 'number' },
    ],
  },
  pledgeTokens: {
    title: 'Pledge Tokens',
    description: 'Pledge tokens to the board.',
    fields: [{ name: 'amount', label: 'Amount', type: 'number' }],
  },
};

// Main Board Page Component
export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { address } = useAccount();
  const [selectedBounty, setSelectedBounty] = useState<any>(null);

  const { data, refetch } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      // GraphQL Queries
      const boardQuery = gql`
        query BoardDetails($boardId: ID!) {
          board(id: $boardId) {
            id
            creator
            name
            description
            rewardToken
            totalPledged
            createdAt
            bounties {
              id
              description
              creator
              deadline
              maxCompletions
              numCompletions
              rewardAmount
              reviewers {
                id
                reviewerAddress
              }
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

      const reviewersQuery = gql`
        query ReviewersForBounty($boardId: ID!, $bountyId: ID!) {
          reviewers(where: { boardId: $boardId, bountyId: $bountyId }) {
            id
            reviewerAddress
          }
        }
      `;
      // Fetch data from The Graph
      const boardData = await request(url, boardQuery, { boardId });
      const submissionsData = await request(url, submissionsQuery, { boardId });
      const reviewersData = await request(url, reviewersQuery, {
        boardId,
        bountyId: 0,
      });

      return {
        board: boardData.board,
        submissions: submissionsData.submissions,
      };
    },
  });
  const tokenSymbol = 'mtk';// useTokenSymbol(data?.board.rewardToken);

  if (!data?.board) {
    return <div>Loading...</div>;
  }
  const board = data.board;
  const rewardTokenAddress = board.rewardToken;
  const submissions = data.submissions;
  const totalPledged = board.totalPledged;

  return (
    <div className="container mx-auto p-4">
      <BoardDetails
        board={board}
        submissions={submissions}
        address={address}
        rewardTokenAddress={rewardTokenAddress}
        totalPledged={totalPledged}
        tokenSymbol={tokenSymbol as string}
        onBountySelect={setSelectedBounty}
        refetch={refetch}
      />
    </div>
  );
}

// Board Details Component
function BoardDetails({
  board,
  submissions,
  address,
  rewardTokenAddress,
  totalPledged,
  tokenSymbol,
  onBountySelect,
  refetch,
}: {
  board: any;
  submissions: any[];
  address: string | undefined;
  rewardTokenAddress: string;
  totalPledged: bigint;
  tokenSymbol: string;
  onBountySelect: (bounty: any) => void;
  refetch: () => void;
}) {
  // Contract Hooks
  const createBounty = useCreateBounty();
  const submitProof = useSubmitProof();
  const reviewSubmission = useReviewSubmission();
  const addReviewerToBounty = useAddReviewerToBounty();
  const updateBountyBoard = useUpdateBountyBoard();
  const updateBounty = useUpdateBounty();
  const cancelBounty = useCancelBounty();
  const closeBoard = useCloseBoard();
  const withdrawPledgedTokens = useWithdrawPledgedTokens();
  const joinBoard = useJoinBoard();
  const pledgeTokens = usePledgeTokens();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<keyof typeof modalConfigs | null>(
    null,
  );
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);

  // User Roles
  const isCreator = address?.toLowerCase() === board.creator;
  const isMember = board.members.some((member) => member.member === address?.toLowerCase());
  const isReviewerForBounty = (bountyId: string) => {
    const bounty = board.bounties.find((b) => b.id === bountyId);
    return bounty?.reviewers.includes(address?.toLowerCase());
  };

  // Modal Handlers
  const handleOpenModal = (
    type: keyof typeof modalConfigs,
    bountyId?: string,
  ) => {
    setModalType(type);
    setSelectedBountyId(bountyId || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedBountyId(null);
    setIsModalOpen(false);
  };

  // Contract Action Handlers
  const handleAction = async (action: string, bountyId?: string) => {
    const boardIdNum = parseInt(board.id);

    try {
      switch (action) {
        case 'joinBoard':
          await joinBoard({ boardId: boardIdNum });
          break;
        case 'cancelBounty':
          await cancelBounty({
            boardId: boardIdNum,
            bountyId: parseInt(bountyId!),
          });
          break;
        case 'closeBoard':
          await closeBoard({ boardId: boardIdNum });
          break;
        case 'withdrawPledgedTokens':
          await withdrawPledgedTokens({ boardId: boardIdNum });
          break;
        default:
          break;
      }
      toast({
        title: 'Success',
        description: `${action} successful!`,
      });
      refetch();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error performing ${action}: ${error}`,
      });
    }
  };

  // Modal Submission Handler
  const handleModalSubmit = async (data: any) => {
    const boardIdNum = parseInt(board.id);

    try {
      switch (modalType) {
        case 'addBounty':
          await createBounty({
            boardId: boardIdNum,
            description: data.description,
            deadline: data.deadline,
            maxCompletions: data.maxCompletions,
            rewardAmount: data.rewardAmount,
          });
          break;
        case 'submitProof':
          await submitProof({
            boardId: boardIdNum,
            bountyId: parseInt(selectedBountyId!),
            proof: data.proof,
          });
          break;
        case 'reviewSubmission':
          await reviewSubmission({
            boardId: boardIdNum,
            bountyId: parseInt(selectedBountyId!),
            submissionIndex: submissions.findIndex(
              (submission) => submission.id === selectedBountyId,
            ),
            approved: data.approved,
          });
          break;
        case 'addReviewer':
          await addReviewerToBounty({
            boardId: boardIdNum,
            bountyId: parseInt(selectedBountyId!),
            reviewer: data.reviewer,
          });
          break;
        case 'updateBoard':
          await updateBountyBoard({
            boardId: boardIdNum,
            name: data.name,
            description: data.description,
            rewardToken: data.rewardToken,
          });
          break;
        case 'updateBounty':
          await updateBounty({
            boardId: boardIdNum,
            bountyId: parseInt(selectedBountyId!),
            description: data.description,
            deadline: data.deadline,
            maxCompletions: data.maxCompletions,
            rewardAmount: data.rewardAmount,
          });
          break;
        case 'pledgeTokens':
          await pledgeTokens({ boardId: boardIdNum, amount: data.amount });
        default:
          break;
      }
      toast({
        title: 'Success',
        description: `${modalType} successful!`,
      });
      refetch();
      handleCloseModal(); // Close the modal after successful submission
    } catch (error) {
      console.error(`Error performing ${modalType}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error performing ${modalType}: ${error}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{board.name}</CardTitle>
          {isCreator && (
            <BoardActionsDropdown
              onOpenUpdateBoardModal={() => handleOpenModal('updateBoard')}
              onCloseBoard={() => handleAction('closeBoard')}
              onWithdrawPledgedTokens={() =>
                handleAction('withdrawPledgedTokens')
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Board Information */}
        <p className="mb-2">
          <strong>Description:</strong> {board.description}
        </p>
        <p className="mb-2">
          <strong>Created:</strong>{' '}
          {format(new Date(board.createdAt * 1000), 'PPP')}
        </p>
        <p className="mb-2">
          <strong>Reward Token:</strong> {tokenSymbol} (
          {rewardTokenAddress})
        </p>
        <p className="mb-4">
          <strong>Total Pledged:</strong>{' '}
          {totalPledged.toString()} {tokenSymbol}
        </p>

        {/* Join Board Button */}
        {!isMember && (
          <Button onClick={() => handleAction('joinBoard')}>
            Join Board
          </Button>
        )}

        {/* Pledge Tokens Button */}
        {isMember && (
          <Button onClick={() => handleOpenModal('pledgeTokens')}>
            Pledge Tokens
          </Button>
        )}

        {/* Add Bounty Button */}
        {isCreator && (
          <Button onClick={() => handleOpenModal('addBounty')}>
            Add Bounty
          </Button>
        )}

        {/* Bounty List */}
        <h2 className="text-xl font-bold mb-2 mt-4">Bounties</h2>
        <BountyList
          bounties={board.bounties}
          address={address}
          onBountySelect={onBountySelect}
          onOpenSubmitProofModal={(bountyId) =>
            handleOpenModal('submitProof', bountyId)
          }
          onOpenAddReviewerModal={(bountyId) =>
            handleOpenModal('addReviewer', bountyId)
          }
          onOpenUpdateBountyModal={(bountyId) =>
            handleOpenModal('updateBounty', bountyId)
          }
          onCancelBounty={(bountyId) => handleAction('cancelBounty', bountyId)}
        />

        {/* Member Submission Table */}
        <h2 className="text-xl font-bold mb-2 mt-4">
          Members and Submissions
        </h2>
        <MemberSubmissionTable
          members={board.members}
          bounties={board.bounties}
          submissions={submissions}
          address={address}
          onOpenReviewSubmissionModal={(submission) =>
            handleOpenModal('reviewSubmission', submission.bounty.id)
          }
        />

        {/* Dynamic Modal */}
        {modalType && (
          <DynamicModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            config={modalConfigs[modalType]}
            boardId={board.id}
            bountyId={selectedBountyId as string}
            selectedBounty={selectedBountyId}
            onSubmit={handleModalSubmit}
          />
        )}
      </CardContent>
    </Card>
  );
}
