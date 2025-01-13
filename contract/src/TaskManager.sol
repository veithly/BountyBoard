// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./BoardStorage.sol";

contract TaskManager is BoardStorage {
    // Event definition
    event TaskCreated(
        uint256 indexed boardId,
        uint256 indexed taskId,
        address creator,
        string name,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount,
        uint256 createdAt
    );

    event TaskUpdated(
        uint256 indexed boardId,
        uint256 indexed taskId,
        string name,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount,
        string config,
        bool allowSelfCheck
    );

    event TaskCancelled(
        uint256 indexed boardId,
        uint256 indexed taskId
    );

    // Event emitted when a reviewer is added to a bounty
    event ReviewerAdded(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address reviewer
    );

    // Function to create a new bounty within a bounty board
    function createTask(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount,
        string memory _config,
        bool _allowSelfCheck      // Keep the allowSelfCheck parameter
    ) public {
        Board storage board = boards[_boardId];
        require(
            board.creator == msg.sender,
            "Only the board creator can create tasks"
        );

        uint256 taskId = board.tasks.length;
        board.tasks.push();
        Task storage newTask = board.tasks[taskId];

        newTask.id = taskId;
        newTask.name = _name;
        newTask.creator = msg.sender;
        newTask.description = _description;
        newTask.deadline = _deadline;
        newTask.maxCompletions = _maxCompletions > 0 ? _maxCompletions : 1;
        newTask.numCompletions = 0;
        newTask.completed = false;
        newTask.rewardAmount = _rewardAmount;
        newTask.createdAt = block.timestamp;
        newTask.cancelled = false;
        newTask.config = _config;
        newTask.reviewers.push(msg.sender);
        newTask.allowSelfCheck = _allowSelfCheck;

        emit TaskCreated(
            _boardId,
            taskId,
            msg.sender,
            _name,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount,
            block.timestamp
        );
    }

    // Function to update bounty details (only callable by the bounty creator)
    function updateTask(
        uint256 _boardId,
        uint256 _taskId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount,
        string memory _config,
        bool _allowSelfCheck
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can update the task"
        );
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");

        task.name = _name;
        task.description = _description;
        task.deadline = _deadline;
        task.maxCompletions = _maxCompletions;
        task.rewardAmount = _rewardAmount;
        task.config = _config;
        task.allowSelfCheck = _allowSelfCheck;

        emit TaskUpdated(
            _boardId,
            _taskId,
            _name,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount,
            _config,
            _allowSelfCheck
        );
    }

        // Function for the board creator to cancel a task
    function cancelTask(uint256 _boardId, uint256 _taskId) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can cancel the task"
        );
        require(!task.completed, "Task is already completed");

        task.cancelled = true;
        emit TaskCancelled(_boardId, _taskId);
    }

    // Function for the board creator to add a reviewer to a specific task
    function addReviewerToTask(
        uint256 _boardId,
        uint256 _taskId,
        address _reviewer
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can add reviewers"
        );

        for(uint i = 0; i < task.reviewers.length; i++) {
            require(task.reviewers[i] != _reviewer, "Reviewer already exists");
        }

        task.reviewers.push(_reviewer);
        emit ReviewerAdded(_boardId, _taskId, _reviewer);
    }
}