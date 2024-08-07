// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BountyBoard is Initializable, AccessControl {
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Structure to represent a bounty (task)
    struct Bounty {
        address creator;        // Address of the bounty creator
        string description;     // Description of the bounty
        uint256 deadline;       // Unix timestamp for the bounty deadline (0 for no deadline)
        uint256 maxCompletions; // Maximum number of completions allowed
        uint256 numCompletions; // Current number of completions
        address[] reviewers;    // Addresses of reviewers (can be empty for no review)
        bool completed;         // Flag to indicate if the bounty is completed
        uint256 rewardAmount;    // Amount of reward tokens offered for the bounty
        uint256 createdAt;      // Timestamp of bounty creation
    }

    // Structure to represent a bounty board
    struct Board {
        address creator;        // Address of the bounty board creator
        string name;            // Name of the bounty board
        string description;     // Description of the bounty board
        Bounty[] bounties;      // Array of bounties associated with the board
        IERC20 rewardToken;     // ERC20 token used for rewards
        uint256 totalPledged;   // Total amount of reward tokens pledged
        mapping(address => bool) members; // Mapping to track board members
        uint256 createdAt;      // Timestamp of board creation
    }

    // Mapping from bounty board ID to bounty board details
    mapping(uint256 => Board) public boards;
    uint256 public boardCount; // Counter for bounty board IDs

    // Structure to represent a submission for a bounty
    struct Submission {
        address submitter;  // Address of the user who submitted the task
        string proof;      // Proof of completion (e.g., link to a GitHub repo, document, etc.)
        bool reviewed;      // Flag to indicate if the submission has been reviewed
        bool approved;      // Flag to indicate if the submission has been approved by a reviewer
        uint256 submittedAt;  // Timestamp of submission
    }

    // Mapping from bounty ID to an array of submissions
    mapping(uint256 => mapping(uint256 => Submission[])) public bountySubmissions;

    // Event emitted when a new bounty board is created
    event BountyBoardCreated(uint256 boardId, address creator, string name);

    // Event emitted when a new bounty is created
    event BountyCreated(uint256 boardId, uint256 bountyId, address creator, string description);

    // Event emitted when a bounty is successfully completed
    event BountySucceeded(uint256 boardId, uint256 bountyId, address participant);

    // Event emitted when a bounty fails due to no valid submissions
    event BountyFailed(uint256 boardId, uint256 bountyId);

    // Event emitted when tokens are pledged to a bounty board
    event TokensPledged(uint256 boardId, address pledger, uint256 amount);

    // Event emitted when bounty details are updated
    event BountyUpdated(uint256 boardId, uint256 bountyId);

    // Event emitted when a submission is made for a bounty
    event SubmissionMade(uint256 boardId, uint256 bountyId, address submitter);

    // Event emitted when a submission is reviewed
    event SubmissionReviewed(uint256 boardId, uint256 bountyId, address reviewer, address submitter, bool approved);

    // Event emitted when a user joins a board
    event UserJoinedBoard(uint256 boardId, address user);

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
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender); // Grant the admin role to the deployer
    }

    // --- Bounty Board Functions ---

    // Function to create a new bounty board
    function createBountyBoard(string memory _name, string memory _description, address _rewardToken) public {
        // Increment the board count
        boardCount++;

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

        // Emit the BountyBoardCreated event
        emit BountyBoardCreated(boardCount, msg.sender, _name);
    }

    // Function to create a new bounty within a bounty board
    function createBounty(
        uint256 _boardId,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount
    ) public {
        // Get the bounty board from the `boards` mapping
        Board storage board = boards[_boardId];

        // Only the bounty board creator can create bounties
        require(board.creator == msg.sender, "Only the bounty board creator can create bounties");

        // Create a new bounty and add it to the `bounties` array of the board
        uint256 bountyId = board.bounties.length;
        board.bounties.push();
        Bounty storage newBounty = board.bounties[bountyId];

        newBounty.creator = msg.sender;
        newBounty.description = _description;
        newBounty.deadline = _deadline;
        newBounty.maxCompletions = _maxCompletions > 0 ? _maxCompletions : 1; // Default to 1 if 0 or less
        newBounty.numCompletions = 0;
        newBounty.completed = false;
        newBounty.rewardAmount = _rewardAmount;
        newBounty.createdAt = block.timestamp;

        // Set the default reviewer to the creator
        newBounty.reviewers.push(msg.sender);

        // Emit the BountyCreated event
        emit BountyCreated(_boardId, bountyId, msg.sender, _description);
    }


    // Function to pledge tokens to a bounty board
    function pledgeTokens(uint256 _boardId, uint256 _amount) public payable {
        // Get the bounty board from the `boards` mapping
        Board storage board = boards[_boardId];

        // If the reward token is ETH, require a non-zero ETH value
        if (board.rewardToken == IERC20(address(0))) {
            require(msg.value > 0, "Pledge amount must be greater than 0");
            // Update the total pledged amount for the board (in Wei)
            board.totalPledged += msg.value;
        } else {
            // Require a non-zero token amount
            require(_amount > 0, "Pledge amount must be greater than 0");
            // Transfer tokens from the user to the contract
            board.rewardToken.transferFrom(msg.sender, address(this), _amount);
            // Update the total pledged amount for the board
            board.totalPledged += _amount;
        }

        // Emit the TokensPledged event
        emit TokensPledged(_boardId, msg.sender, board.rewardToken == IERC20(address(0)) ? msg.value : _amount);
    }

    // Function to join a bounty board
    function joinBoard(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(!board.members[msg.sender], "User is already a member of this board");

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
        address[] memory _reviewers,
        uint256 _rewardAmount
    ) public {
        // Get the bounty board and bounty from the `boards` mapping
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];

        // Only the bounty creator can update the bounty
        require(bounty.creator == msg.sender, "Only the bounty creator can update the bounty");

        // Update the bounty details
        bounty.description = _description;
        bounty.deadline = _deadline;
        bounty.maxCompletions = _maxCompletions;
        bounty.reviewers = _reviewers;
        bounty.rewardAmount = _rewardAmount;

        // Emit the BountyUpdated event
        emit BountyUpdated(_boardId, _bountyId);
    }

    // Function to submit proof of completion for a bounty
    function submitProof(uint256 _boardId, uint256 _bountyId, string memory _proof) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];

        // Ensure the bounty is not completed and the user is a member of the board
        require(!bounty.completed, "Bounty is already completed");
        require(board.members[msg.sender], "User is not a member of this board");

        // Add the submission to the bountySubmissions array
        bountySubmissions[_boardId][_bountyId].push(Submission({
            submitter: msg.sender,
            proof: _proof,
            reviewed: false,
            approved: false,
            submittedAt: block.timestamp
        }));

        // Emit the SubmissionMade event
        emit SubmissionMade(_boardId, _bountyId, msg.sender);
    }

    // Function for reviewers to review a submission
    function reviewSubmission(uint256 _boardId, uint256 _bountyId, uint256 _submissionIndex, bool _approved) public {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];
        Submission storage submission = bountySubmissions[_boardId][_bountyId][_submissionIndex];

        // Ensure the caller has the REVIEWER_ROLE and the bounty is not completed
        require(hasRole(REVIEWER_ROLE, msg.sender) || msg.sender == bounty.creator, "Caller is not a reviewer");
        require(!bounty.completed, "Bounty is already completed");

        // Update the submission
        submission.reviewed = true;
        submission.approved = _approved;

        // Emit the SubmissionReviewed event
        emit SubmissionReviewed(_boardId, _bountyId, msg.sender, submission.submitter, _approved);

        // If the submission is approved, distribute the reward and increment completion count
        if (_approved) {
            distributeReward(_boardId, _bountyId, submission.submitter);
            bounty.numCompletions++;

            // Check if the bounty has reached the maximum number of completions
            if (bounty.numCompletions == bounty.maxCompletions) {
                bounty.completed = true;
            }

            emit BountySucceeded(_boardId, _bountyId, submission.submitter);
        }

        // If all submissions are reviewed and none are approved, the bounty fails
        if (allSubmissionsReviewed(_boardId, _bountyId) && !anySubmissionApproved(_boardId, _bountyId)) {
            bounty.completed = true;
            emit BountyFailed(_boardId, _bountyId);
        }
    }

    // Function to distribute the reward to the participant
    function distributeReward(uint256 _boardId, uint256 _bountyId, address _participant) internal {
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];

        // Ensure the bounty has enough pledged tokens/ETH
        require(board.totalPledged >= bounty.rewardAmount, "Not enough pledged tokens to distribute reward");

        // If the reward token is ETH, transfer ETH directly
        if (board.rewardToken == IERC20(address(0))) {
            payable(_participant).transfer(bounty.rewardAmount);
        } else {
            // Transfer the reward tokens to the participant
            board.rewardToken.transfer(_participant, bounty.rewardAmount);
        }

        // Update the total pledged amount for the board
        board.totalPledged -= bounty.rewardAmount;
    }

    // Helper function to check if all submissions for a bounty have been reviewed
    function allSubmissionsReviewed(uint256 _boardId, uint256 _bountyId) internal view returns (bool) {
        Submission[] storage submissions = bountySubmissions[_boardId][_bountyId];
        for (uint256 i = 0; i < submissions.length; i++) {
            if (!submissions[i].reviewed) {
                return false;
            }
        }
        return true;
    }

    // Helper function to check if any submission for a bounty has been approved
    function anySubmissionApproved(uint256 _boardId, uint256 _bountyId) internal view returns (bool) {
        Submission[] storage submissions = bountySubmissions[_boardId][_bountyId];
        for (uint256 i = 0; i < submissions.length; i++) {
            if (submissions[i].approved) {
                return true;
            }
        }
        return false;
    }

    // Function for the admin to add a reviewer
    function addReviewer(address _reviewer) public onlyRole(ADMIN_ROLE) {
        _grantRole(REVIEWER_ROLE, _reviewer);
    }

    // --- Upgradeability Functions ---

    function upgradeTo(address newImplementation) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Require a valid implementation address
        require(newImplementation != address(0), "Invalid implementation address");

        // Update the implementation address
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
        // Get the current implementation address
        address _implementation = implementation;

        // Require a valid implementation address
        require(_implementation != address(0), "Implementation not set");

        // Delegate the call to the implementation contract
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
