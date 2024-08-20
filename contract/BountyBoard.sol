// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BountyBoard is Initializable, AccessControl {
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    // Structure to represent a bounty (task)
    struct Bounty {
        address creator; // Address of the bounty creator
        string description; // Description of the bounty
        uint256 deadline; // Unix timestamp for the bounty deadline (0 for no deadline)
        uint256 maxCompletions; // Maximum number of completions allowed
        uint256 numCompletions; // Current number of completions
        mapping(address => bool) reviewers; // Mapping of reviewers for this specific bounty
        bool completed; // Flag to indicate if the bounty is completed
        uint256 rewardAmount; // Amount of reward tokens offered for the bounty
        uint256 createdAt; // Timestamp of bounty creation
        bool cancelled; // Flag to indicate if the bounty is cancelled
    }

    // Structure to represent a bounty board
    struct Board {
        address creator; // Address of the bounty board creator
        string name; // Name of the bounty board
        string description; // Description of the bounty board
        Bounty[] bounties; // Array of bounties associated with the board
        IERC20 rewardToken; // ERC20 token used for rewards
        uint256 totalPledged; // Total amount of reward tokens pledged
        mapping(address => bool) members; // Mapping to track board members
        uint256 createdAt; // Timestamp of board creation
        bool closed; // Flag to indicate if the board is closed
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

    // Event emitted when a new bounty is created
    event BountyCreated(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address indexed creator,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount,
        uint256 createdAt
    );

    // Event emitted when a bounty is successfully completed
    event BountySucceeded(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        address participant,
        string bountyDescription,
        uint256 rewardAmount
    );

    // Event emitted when a bounty fails due to no valid submissions
    event BountyFailed(
        uint256 indexed boardId,
        uint256 indexed bountyId,
        string bountyDescription,
        uint256 rewardAmount
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

    // --- Upgradeability ---
    address public implementation;

    // --- Initialization ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        boardCount = 0;
        implementation = address(this);
    }

    // --- Bounty Board Functions ---

    // Function to create a new bounty board
    function createBountyBoard(
        string memory _name,
        string memory _description,
        address _rewardToken
    ) public {
        // Create a new bounty board and store it in the `boards` mapping
        Board storage newBoard = boards[boardCount];
        newBoard.creator = msg.sender;
        newBoard.name = _name;
        newBoard.description = _description;

        // If no reward token address is provided, use ETH (address(0))
        if (_rewardToken == address(0)) {
            newBoard.rewardToken = IERC20(address(0));
        } else {
            newBoard.rewardToken = IERC20(_rewardToken);
        }

        newBoard.totalPledged = 0;

        // Add the creator as a member of the board
        newBoard.members[msg.sender] = true;

        // Record the creation time
        newBoard.createdAt = block.timestamp;

        // Grant the creator the REVIEWER_ROLE for this board
        _grantRole(REVIEWER_ROLE, msg.sender);

        // Emit the BountyBoardCreated event with relevant data
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
    function createBounty(
        uint256 _boardId,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount
    ) public {
        Board storage board = boards[_boardId];
        require(
            board.creator == msg.sender,
            "Only the board creator can create bounties"
        );

        uint256 bountyId = board.bounties.length;
        board.bounties.push();
        Bounty storage newBounty = board.bounties[bountyId];

        newBounty.creator = msg.sender;
        newBounty.description = _description;
        newBounty.deadline = _deadline;
        newBounty.maxCompletions = _maxCompletions > 0 ? _maxCompletions : 1;
        newBounty.numCompletions = 0;
        newBounty.completed = false;
        newBounty.rewardAmount = _rewardAmount;
        newBounty.createdAt = block.timestamp;
        newBounty.cancelled = false;

        // Grant the creator the REVIEWER_ROLE for this specific bounty
        newBounty.reviewers[msg.sender] = true;

        emit BountyCreated(
            _boardId,
            bountyId,
            msg.sender,
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
        require(
            !board.members[msg.sender],
            "User is already a member of this board"
        );

        board.members[msg.sender] = true;
        emit UserJoinedBoard(_boardId, msg.sender);
    }

    // Function to update bounty details (only callable by the bounty creator)
    function updateBounty(
        uint256 _boardId,
        uint256 _bountyId,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount
    ) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        require(
            msg.sender == bounty.creator,
            "Only the bounty creator can update the bounty"
        );
        require(!bounty.completed, "Bounty is already completed");
        require(!bounty.cancelled, "Bounty is cancelled");

        bounty.description = _description;
        bounty.deadline = _deadline;
        bounty.maxCompletions = _maxCompletions;
        bounty.rewardAmount = _rewardAmount;

        emit BountyUpdated(
            _boardId,
            _bountyId,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount
        );
    }

    // Function to submit proof of completion for a bounty
    function submitProof(
        uint256 _boardId,
        uint256 _bountyId,
        string memory _proof
    ) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        require(!board.closed, "Board is closed");
        require(!bounty.completed, "Bounty is already completed");
        require(!bounty.cancelled, "Bounty is cancelled");
        require(
            bounty.deadline == 0 || bounty.deadline >= block.timestamp,
            "Bounty deadline has passed"
        );
        require(
            board.members[msg.sender],
            "User is not a member of this board"
        );

        Submission storage submission = bountySubmissions[_boardId][_bountyId][
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
                "User has already been approved for this bounty"
            );
            submission.proof = _proof;
            submission.reviewed = false;
            submission.submittedAt = block.timestamp;
        }

        emit SubmissionMade(
            _boardId,
            _bountyId,
            msg.sender,
            _proof,
            block.timestamp
        );
    }

    // Function for reviewers to review a submission
    function reviewSubmission(
        uint256 _boardId,
        uint256 _bountyId,
        address _submitter,
        bool _approved
    ) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        Submission storage submission = bountySubmissions[_boardId][_bountyId][
            _submitter
        ];

        require(
            bounty.reviewers[msg.sender],
            "Caller is not a reviewer for this bounty"
        );
        require(!bounty.completed, "Bounty is already completed");
        require(!bounty.cancelled, "Bounty is cancelled");
        require(
            submission.submitter != address(0),
            "No submission found for this user"
        ); // Make sure a submission exists

        submission.reviewed = true;
        submission.approved = _approved;

        emit SubmissionReviewed(
            _boardId,
            _bountyId,
            msg.sender,
            submission.submitter,
            _approved
        );

        if (_approved) {
            distributeReward(_boardId, _bountyId, submission.submitter);
            bounty.numCompletions++;

            if (bounty.numCompletions >= bounty.maxCompletions) {
                bounty.completed = true;
                emit BountySucceeded(
                    _boardId,
                    _bountyId,
                    submission.submitter,
                    bounty.description,
                    bounty.rewardAmount
                );
            }
        }
    }

    // Function to distribute the reward to the participant
    function distributeReward(
        uint256 _boardId,
        uint256 _bountyId,
        address _participant
    ) internal {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];

        require(
            board.totalPledged >= bounty.rewardAmount,
            "Not enough pledged tokens to distribute reward"
        );

        if (board.rewardToken == IERC20(address(0))) {
            payable(_participant).transfer(bounty.rewardAmount);
        } else {
            board.rewardToken.transfer(_participant, bounty.rewardAmount);
        }

        board.totalPledged -= bounty.rewardAmount;

        emit RewardDistributionUpdated(_boardId, board.totalPledged);
    }

    // Function for the board creator to add a reviewer to a specific bounty
    function addReviewerToBounty(
        uint256 _boardId,
        uint256 _bountyId,
        address _reviewer
    ) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        require(
            msg.sender == bounty.creator,
            "Only the bounty creator can add reviewers"
        );

        bounty.reviewers[_reviewer] = true;
        emit ReviewerAdded(_boardId, _bountyId, _reviewer);
    }

    // Function for the board creator to cancel a bounty
    function cancelBounty(uint256 _boardId, uint256 _bountyId) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        require(
            msg.sender == bounty.creator,
            "Only the bounty creator can cancel the bounty"
        );
        require(!bounty.completed, "Bounty is already completed");

        bounty.cancelled = true;
        emit BountyCancelled(_boardId, _bountyId);
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
            board.members[msg.sender],
            "User is not a member of this board"
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

    // --- Upgradeability Functions ---

    function upgradeTo(
        address newImplementation
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            newImplementation != address(0),
            "Invalid implementation address"
        );
        implementation = newImplementation;
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
        address _implementation = implementation;
        require(_implementation != address(0), "Implementation not set");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                _implementation,
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
}
