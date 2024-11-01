// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract BountyBoard is Initializable, AccessControlUpgradeable {
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    // Structure to represent a task
    struct Task {
        uint256 id;         // ID of the task
        string name;        // Name of the task
        address creator;    // Address of the task creator
        string description; // Description of the task
        uint256 deadline;   // Unix timestamp for the task deadline (0 for no deadline)
        uint256 maxCompletions; // Maximum number of completions allowed
        uint256 numCompletions; // Current number of completions
        address[] reviewers; // Array of reviewer addresses
        bool completed;     // Flag to indicate if the task is completed
        uint256 rewardAmount; // Amount of reward tokens offered for the task
        uint256 createdAt;  // Timestamp of task creation
        bool cancelled;     // Flag to indicate if the task is cancelled
    }

    // Structure to represent a bounty board
    struct Board {
        uint256 id;         // ID of the board
        address creator;    // Address of the bounty board creator
        string name;        // Name of the bounty board
        string description; // Description of the bounty board
        string img;         // URL or IPFS hash of the board's image
        Task[] tasks;       // Array of tasks associated with the board
        IERC20 rewardToken; // ERC20 token used for rewards
        uint256 totalPledged; // Total amount of reward tokens pledged
        address[] members;  // Array of board members
        uint256 createdAt;  // Timestamp of board creation
        bool closed;        // Flag to indicate if the board is closed
    }

    // Mapping from bounty board ID to bounty board details
    mapping(uint256 => Board) public boards;
    uint256 public boardCount; // Counter for bounty board IDs

    // Structure to represent a submission for a bounty
    struct Submission {
        address submitter; // Address of the user who submitted the task
        string proof; // Proof of completion (e.g., link to a GitHub repo, document, etc.)
        bool reviewed; // Flag to indicate if the submission has been reviewed
        bool approved; // Flag to indicate if the submission has been approved by a reviewer
        uint256 submittedAt; // Timestamp of submission
    }

    // Mapping from bounty ID to an array of submissions
    mapping(uint256 => mapping(uint256 => mapping(address => Submission)))
        public bountySubmissions;

    // Event emitted when a new bounty board is created
    event BountyBoardCreated(
        uint256 indexed boardId,
        address indexed creator,
        string name,
        string description,
        address rewardToken,
        uint256 createdAt
    );

    // Event emitted when tokens are pledged to a bounty board
    event TokensPledged(
        uint256 indexed boardId,
        address indexed pledger,
        uint256 amount
    );

    // Event emitted when bounty details are updated
    event BountyUpdated(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount
    );

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
        uint256 rewardAmount
    );

    event TaskSucceeded(
        uint256 indexed boardId,
        uint256 indexed taskId,
        address submitter,
        uint256 rewardAmount
    );

    event TaskCancelled(uint256 indexed boardId, uint256 indexed taskId);

    // Event emitted when a submission is made for a bounty
    event SubmissionMade(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address indexed submitter,
        string proof,
        uint256 submittedAt
    );

    // Event emitted when a submission is reviewed
    event SubmissionReviewed(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address indexed reviewer,
        address submitter,
        bool approved
    );

    // Event emitted when a user joins a board
    event UserJoinedBoard(uint256 indexed boardId, address indexed user);

    // Event emitted when a reviewer is added to a bounty
    event ReviewerAdded(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address reviewer
    );

    // Event emitted when a bounty is cancelled
    event BountyCancelled(uint256 indexed boardId, uint256 indexed bountyId);

    // Event emitted when a bounty board is closed
    event BountyBoardClosed(uint256 indexed boardId);

    // Event emitted when pledged tokens are withdrawn
    event TokensWithdrawn(
        uint256 indexed boardId,
        address indexed withdrawer,
        uint256 amount
    );

    // Event emitted when a bounty board is updated
    event BountyBoardUpdated(
        uint256 indexed boardId,
        string name,
        string description,
        address rewardToken
    );

    // Event emmitted when distribution of reward tokens is updated
    event RewardDistributionUpdated(
        uint256 indexed boardId,
        uint256 totalPledged
    );

    // --- Initialization ---

    address private _implementation;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        boardCount = 0;
        _setImplementation(address(this));
    }

    // --- Bounty Board Functions ---

    // Function to create a new bounty board
    function createBountyBoard(
        string memory _name,
        string memory _description,
        string memory _img,
        address _rewardToken
    ) public {
        // Create a new bounty board and store it in the `boards` mapping
        Board storage newBoard = boards[boardCount];
        newBoard.id = boardCount;
        newBoard.creator = msg.sender;
        newBoard.name = _name;
        newBoard.description = _description;
        newBoard.img = _img;

        if (_rewardToken == address(0)) {
            newBoard.rewardToken = IERC20(address(0));
        } else {
            newBoard.rewardToken = IERC20(_rewardToken);
        }

        newBoard.totalPledged = 0;
        newBoard.members.push(msg.sender);
        newBoard.createdAt = block.timestamp;
        newBoard.closed = false;

        _grantRole(REVIEWER_ROLE, msg.sender);

        emit BountyBoardCreated(
            boardCount,
            msg.sender,
            _name,
            _description,
            _rewardToken,
            block.timestamp
        );

        boardCount++;
    }

    // Function to update bounty board details
    function updateBountyBoard(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        address _rewardToken
    ) public {
        Board storage board = boards[_boardId];
        require(
            msg.sender == board.creator,
            "Only the board creator can update the board"
        );

        board.name = _name;
        board.description = _description;

        if (_rewardToken != address(0)) {
            board.rewardToken = IERC20(_rewardToken);
        }

        emit BountyBoardUpdated(_boardId, _name, _description, _rewardToken);
    }

    // Function to create a new bounty within a bounty board
    function createTask(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount
    ) public {
        Board storage board = boards[_boardId];
        require(
            board.creator == msg.sender,
            "Only the board creator can create tasks"
        );

        uint256 taskId = board.tasks.length;
        board.tasks.push();
        Task storage newTask = board.tasks[taskId];

        newTask.id = taskId;  // Set the task ID
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

        newTask.reviewers.push(msg.sender);

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

    // Function to pledge tokens to a bounty board
    function pledgeTokens(uint256 _boardId, uint256 _amount) public payable {
        Board storage board = boards[_boardId];
        require(!board.closed, "Board is closed");
        require(_amount > 0, "Pledge amount must be greater than 0");
        require(board.creator == msg.sender, "Only the board creator can pledge tokens");

        if (board.rewardToken == IERC20(address(0))) {
            require(
                msg.value >= _amount,
                "Sent value does not match the pledge amount"
            );
            board.totalPledged += msg.value;
        } else {
            board.rewardToken.transferFrom(msg.sender, address(this), _amount);
            board.totalPledged += _amount;
        }

        emit TokensPledged(
            _boardId,
            msg.sender,
            board.rewardToken == IERC20(address(0)) ? msg.value : _amount
        );
    }

    // Function to join a bounty board
    function joinBoard(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(!board.closed, "Board is closed");

        // Check if already a member
        for(uint i = 0; i < board.members.length; i++) {
            require(board.members[i] != msg.sender, "Already a member");
        }

        board.members.push(msg.sender);
        emit UserJoinedBoard(_boardId, msg.sender);
    }

    // Function to update bounty details (only callable by the bounty creator)
    function updateTask(
        uint256 _boardId,
        uint256 _taskId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount
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

        emit TaskUpdated(
            _boardId,
            _taskId,
            _name,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount
        );
    }

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
            submission.reviewed = false;
            submission.approved = false;
            submission.submittedAt = block.timestamp;
        } else {
            // Update existing submission
            require(
                !submission.approved,
                "User has already been approved for this task"
            );
            submission.proof = _proof;
            submission.reviewed = false;
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
        bool _approved
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        Submission storage submission = bountySubmissions[_boardId][_taskId][
            _submitter
        ];

        bool isReviewer = false;
        for(uint i = 0; i < task.reviewers.length; i++) {
            if(task.reviewers[i] == msg.sender) {
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

        submission.reviewed = true;
        submission.approved = _approved;

        emit SubmissionReviewed(
            _boardId,
            _taskId,
            msg.sender,
            submission.submitter,
            _approved
        );

        if (_approved) {
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

    // Function to distribute the reward to the participant
    function distributeReward(
        uint256 _boardId,
        uint256 _taskId,
        address _participant
    ) internal {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];

        require(
            board.totalPledged >= task.rewardAmount,
            "Not enough pledged tokens to distribute reward"
        );

        if (board.rewardToken == IERC20(address(0))) {
            payable(_participant).transfer(task.rewardAmount);
        } else {
            board.rewardToken.transfer(_participant, task.rewardAmount);
        }

        board.totalPledged -= task.rewardAmount;

        emit RewardDistributionUpdated(_boardId, board.totalPledged);
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

        // 检查审核员是 否已存在
        for(uint i = 0; i < task.reviewers.length; i++) {
            require(task.reviewers[i] != _reviewer, "Reviewer already exists");
        }

        task.reviewers.push(_reviewer);
        emit ReviewerAdded(_boardId, _taskId, _reviewer);
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

    // Function for the board creator to close the board
    function closeBoard(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(
            msg.sender == board.creator,
            "Only the board creator can close the board"
        );

        board.closed = true;
        emit BountyBoardClosed(_boardId);
    }

    // Function for users to withdraw pledged tokens if the board is closed
    function withdrawPledgedTokens(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(board.closed, "Board is not closed");
        require(
            msg.sender == board.creator,
            "Only the board creator can withdraw pledged tokens"
        );

        uint256 amount = board.rewardToken == IERC20(address(0))
            ? board.totalPledged
            : 0;

        if (amount > 0) {
            board.totalPledged = 0;
            payable(msg.sender).transfer(amount);
        } else {
            require(
                board.rewardToken.balanceOf(address(this)) >=
                    board.totalPledged,
                "Not enough tokens to withdraw"
            );
            board.rewardToken.transfer(msg.sender, board.totalPledged);
            board.totalPledged = 0;
        }

        emit TokensWithdrawn(_boardId, msg.sender, amount);
    }


    // Define a struct that contains only the data you want to return
    struct BoardView {
        uint256 id;
        address creator;
        string name;
        string description;
        string img;
        uint256 totalPledged;
        uint256 createdAt;
        address rewardToken;
        bool closed;
    }

    // Function to get all boards without mappings
    function getAllBoards() public view returns (BoardView[] memory) {
        BoardView[] memory allBoards = new BoardView[](boardCount);
        for (uint256 i = 0; i < boardCount; i++) {
            Board storage board = boards[i];
            allBoards[i] = BoardView(
                board.id,
                board.creator,
                board.name,
                board.description,
                board.img,
                board.totalPledged,
                board.createdAt,
                address(board.rewardToken),
                board.closed
            );
        }
        return allBoards;
    }

    // Function to check if a user is a member of a board
    function isBoardMember(uint256 _boardId, address _member) public view returns (bool) {
        Board storage board = boards[_boardId];
        for(uint i = 0; i < board.members.length; i++) {
            if(board.members[i] == _member) {
                return true;
            }
        }
        return false;
    }

    // Define a struct for task view
    struct TaskView {
        uint256 id;
        string name;
        address creator;
        string description;
        uint256 deadline;
        uint256 maxCompletions;
        uint256 numCompletions;
        bool completed;
        uint256 rewardAmount;
        uint256 createdAt;
        bool cancelled;

        address[] reviewers;
    }

    // Function to get all tasks for a specific board without mappings
    function getTasksForBoard(uint256 _boardId) public view returns (TaskView[] memory) {
        Board storage board = boards[_boardId];
        uint256 taskCount = board.tasks.length;

        TaskView[] memory tasks = new TaskView[](taskCount);
        for (uint256 i = 0; i < taskCount; i++) {
            Task storage task = board.tasks[i];
            tasks[i] = TaskView({
                id: task.id,
                name: task.name,
                creator: task.creator,
                description: task.description,
                deadline: task.deadline,
                maxCompletions: task.maxCompletions,
                numCompletions: task.numCompletions,
                completed: task.completed,
                rewardAmount: task.rewardAmount,
                createdAt: task.createdAt,
                cancelled: task.cancelled,
                reviewers: task.reviewers
            });
        }
        return tasks;
    }


    // Define a struct for board detail view
    struct BoardDetailView {
        uint256 id;
        address creator;
        string name;
        string description;
        string img;
        uint256 totalPledged;
        uint256 createdAt;
        bool closed;
        address rewardToken;

        // Tasks information
        TaskView[] tasks;

        // Submissions
        SubmissionView[] submissions;

        // Members
        address[] members;
    }

    // Define a struct for submission view
    struct SubmissionView {
        uint256 taskId;
        address submitter;
        string proof;
        bool reviewed;
        bool approved;
        uint256 submittedAt;
    }

    // Function to get board details
    function getBoardDetail(uint256 _boardId) public view returns (BoardDetailView memory) {
        Board storage board = boards[_boardId];

        // 获取所有任务
        TaskView[] memory tasks = new TaskView[](board.tasks.length);
        for(uint i = 0; i < board.tasks.length; i++) {
            Task storage task = board.tasks[i];
            tasks[i] = TaskView({
                id: task.id,
                name: task.name,
                creator: task.creator,
                description: task.description,
                deadline: task.deadline,
                maxCompletions: task.maxCompletions,
                numCompletions: task.numCompletions,
                completed: task.completed,
                rewardAmount: task.rewardAmount,
                createdAt: task.createdAt,
                cancelled: task.cancelled,
                reviewers: task.reviewers
            });
        }

        // 获取所有提交
        uint256 submissionCount = 0;
        for (uint256 i = 0; i < board.tasks.length; i++) {
            for (uint256 j = 0; j < board.members.length; j++) {
                if (bountySubmissions[_boardId][i][board.members[j]].submitter != address(0)) {
                    submissionCount++;
                }
            }
        }

        SubmissionView[] memory submissions = new SubmissionView[](submissionCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < board.tasks.length; i++) {
            for (uint256 j = 0; j < board.members.length; j++) {
                address member = board.members[j];
                Submission storage sub = bountySubmissions[_boardId][i][member];
                if (sub.submitter != address(0)) {
                    submissions[currentIndex] = SubmissionView({
                        taskId: i,
                        submitter: sub.submitter,
                        proof: sub.proof,
                        reviewed: sub.reviewed,
                        approved: sub.approved,
                        submittedAt: sub.submittedAt
                    });
                    currentIndex++;
                }
            }
        }

        return BoardDetailView({
            id: board.id,
            creator: board.creator,
            name: board.name,
            description: board.description,
            img: board.img,
            totalPledged: board.totalPledged,
            createdAt: board.createdAt,
            closed: board.closed,
            rewardToken: address(board.rewardToken),
            tasks: tasks,
            submissions: submissions,
            members: board.members
        });
    }

    // --- Upgradeability Functions ---

    function upgradeTo(
        address newImplementation
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            newImplementation != address(0),
            "Invalid implementation address"
        );
        _setImplementation(newImplementation);
    }

    // Fallback function to delegate calls to the implementation contract
    fallback() external payable {
        _fallback();
    }

    // Receive function to allow the contract to receive Ether
    receive() external payable {
        _fallback();
    }

    // Internal function to handle fallback and receive
    function _fallback() internal {
        address implementation = _getImplementation();
        require(implementation != address(0), "Implementation not set");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )

            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    // Internal function to set the implementation address
    function _setImplementation(address newImplementation) internal {
        require(newImplementation != address(0), "Invalid implementation address");
        _implementation = newImplementation;
    }

    // Internal function to get the implementation address
    function _getImplementation() internal view returns (address) {
        return _implementation;
    }
}
