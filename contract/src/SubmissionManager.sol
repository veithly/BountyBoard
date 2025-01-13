// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./BoardStorage.sol";
import "./BoardView.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SubmissionManager is BoardStorage, BoardView {
    using ECDSA for bytes32;

    event SubmissionMade(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address indexed submitter,
        string proof,
        uint256 submittedAt
    );

    event SubmissionReviewed(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address indexed reviewer,
        address submitter,
        int8 status,
        string reviewComment
    );

    event TaskSucceeded(
        uint256 indexed boardId,
        uint256 indexed taskId,
        address submitter,
        uint256 rewardAmount
    );

    // Function to submit proof of completion for a bounty
    function submitProof(
        uint256 _boardId,
        uint256 _taskId,
        string memory _proof
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(!board.closed, "Board is closed");
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(
            task.deadline == 0 || task.deadline >= block.timestamp,
            "Task deadline has passed"
        );
        require(
            isBoardMember(_boardId, msg.sender),
            "User is not a member of this board"
        );

        Submission storage submission = bountySubmissions[_boardId][_taskId][
            msg.sender
        ];

        if (submission.submitter == address(0)) {
            // New submission
            submission.submitter = msg.sender;
            submission.proof = _proof;
            submission.status = 0; // Set initial status to pending
            submission.submittedAt = block.timestamp;
        } else {
            // Update existing submission
            require(
                submission.status != 1,
                "User has already been approved for this task"
            );
            submission.proof = _proof;
            submission.status = 0; // Reset status to pending
            submission.submittedAt = block.timestamp;
        }

        emit SubmissionMade(
            _boardId,
            _taskId,
            msg.sender,
            _proof,
            block.timestamp
        );
    }

    // Function for reviewers to review a submission
    function reviewSubmission(
        uint256 _boardId,
        uint256 _taskId,
        address _submitter,
        int8 _status,
        string memory _reviewComment
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        Submission storage submission = bountySubmissions[_boardId][_taskId][
            _submitter
        ];

        bool isReviewer = false;
        for (uint i = 0; i < task.reviewers.length; i++) {
            if (task.reviewers[i] == msg.sender) {
                isReviewer = true;
                break;
            }
        }
        require(isReviewer, "Caller is not a reviewer for this task");

        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(
            submission.submitter != address(0),
            "No submission found for this user"
        );

        submission.status = _status;
        submission.reviewComment = _reviewComment;

        emit SubmissionReviewed(
            _boardId,
            _taskId,
            msg.sender,
            submission.submitter,
            _status,
            _reviewComment
        );

        if (_status == 1) {
            distributeReward(_boardId, _taskId, submission.submitter);
            task.numCompletions++;

            if (task.numCompletions >= task.maxCompletions) {
                task.completed = true;
                emit TaskSucceeded(
                    _boardId,
                    _taskId,
                    submission.submitter,
                    task.rewardAmount
                );
            }
        }
    }

    function selfCheckSubmission(
        uint256 _boardId,
        uint256 _taskId,
        bytes memory _signature,
        string memory _checkData // Review opinion
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];

        require(!board.closed, "Board is closed");
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(task.allowSelfCheck, "Self-check not allowed for this task");
        require(
            task.deadline == 0 || task.deadline >= block.timestamp,
            "Task deadline has passed"
        );
        require(
            isBoardMember(_boardId, msg.sender),
            "User is not a member of this board"
        );

        // Construct message hash
        bytes32 messageHash = keccak256(
            abi.encode(_boardId, _taskId, msg.sender, _checkData)
        );

        // Convert to Ethereum signed message hash
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        // Restore signer address
        address recoveredSigner = ECDSA.recover(
            ethSignedMessageHash,
            _signature
        );

        // Verify the signer
        require(signerAddress == recoveredSigner, "Invalid signature");

        // Create or update commit
        Submission storage submission = bountySubmissions[_boardId][_taskId][
            msg.sender
        ];
        submission.submitter = msg.sender;
        submission.status = 1;
        submission.submittedAt = block.timestamp;
        submission.reviewComment = _checkData;

        // Distribute rewards
        distributeReward(_boardId, _taskId, msg.sender);
        task.numCompletions++;

        if (task.numCompletions >= task.maxCompletions) {
            task.completed = true;
            emit TaskSucceeded(
                _boardId,
                _taskId,
                msg.sender,
                task.rewardAmount
            );
        }

        emit SubmissionReviewed(
            _boardId,
            _taskId,
            recoveredSigner,
            msg.sender,
            1,
            _checkData
        );
    }

    // Add helper function
    function isBoardMember(
        uint256 _boardId,
        address _member
    ) public view virtual override returns (bool) {
        Board storage board = boards[_boardId];
        for (uint i = 0; i < board.members.length; i++) {
            if (board.members[i] == _member) {
                return true;
            }
        }
        return false;
    }

    function distributeReward(uint256 _boardId, uint256 _taskId, address _submitter) internal {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];

        if (address(board.rewardToken) == address(0)) {
            require(
                task.rewardAmount <= board.totalPledged,
                "Reward amount exceeds total pledged"
            );
            payable(_submitter).transfer(task.rewardAmount);
        } else {
            require(
                board.rewardToken.transfer(_submitter, task.rewardAmount),
                "Reward transfer failed"
            );
        }
        board.totalPledged -= task.rewardAmount;
    }
}
