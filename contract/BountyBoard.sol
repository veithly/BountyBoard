// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract BountyBoard is Initializable {
    // Structure to represent a bounty (task)
    struct Bounty {
        address creator;        // Address of the bounty creator
        string description;     // Description of the bounty
        uint256 deadline;       // Unix timestamp for the bounty deadline (0 for no deadline)
        uint256 maxParticipants; // Maximum number of participants allowed
        uint256 numParticipants; // Current number of participants
        address[] reviewers;    // Addresses of reviewers (can be empty for no review)
        mapping(address => bool) participants; // Mapping to track participants
        bool completed;         // Flag to indicate if the bounty is completed
        uint256 rewardAmount;    // Amount of reward tokens offered for the bounty
    }

    // Structure to represent a bounty board
    struct Board {
        address creator;        // Address of the bounty board creator
        string name;            // Name of the bounty board
        Bounty[] bounties;      // Array of bounties associated with the board
        IERC20 rewardToken;     // ERC20 token used for rewards
        uint256 totalPledged;   // Total amount of reward tokens pledged
    }

    // Mapping from bounty board ID to bounty board details
    mapping(uint256 => Board) public boards;
    uint256 public boardCount; // Counter for bounty board IDs

    // Event emitted when a new bounty board is created
    event BountyBoardCreated(uint256 boardId, address creator, string name);

    // Event emitted when a new bounty is created
    event BountyCreated(uint256 boardId, uint256 bountyId, address creator, string description);

    // Event emitted when a bounty is completed
    event BountyCompleted(uint256 boardId, uint256 bountyId, address participant);

    // Event emitted when tokens are pledged to a bounty board
    event TokensPledged(uint256 boardId, address pledger, uint256 amount);

    // Event emitted when bounty details are updated
    event BountyUpdated(uint256 boardId, uint256 bountyId);

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
    function createBountyBoard(string memory _name, IERC20 _rewardToken) public {
        // Increment the board count
        boardCount++;

        // Create a new bounty board and store it in the `boards` mapping
        Board storage newBoard = boards[boardCount];
        newBoard.creator = msg.sender;
        newBoard.name = _name;
        newBoard.rewardToken = _rewardToken;
        newBoard.totalPledged = 0;

        // Emit the BountyBoardCreated event
        emit BountyBoardCreated(boardCount, msg.sender, _name);
    }

    // Function to create a new bounty within a bounty board
    function createBounty(
        uint256 _boardId,
        string memory _description,
        uint256 _deadline,
        uint256 _maxParticipants,
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
        newBounty.maxParticipants = _maxParticipants > 0 ? _maxParticipants : 1; // Default to 1 if 0 or less
        newBounty.numParticipants = 0;
        newBounty.completed = false;
        newBounty.rewardAmount = _rewardAmount;

        // Set the default reviewer to the creator
        newBounty.reviewers.push(msg.sender);

        // Emit the BountyCreated event
        emit BountyCreated(_boardId, bountyId, msg.sender, _description);
    }


    // Function to pledge tokens to a bounty board
    function pledgeTokens(uint256 _boardId, uint256 _amount) public {
        // Get the bounty board from the `boards` mapping
        Board storage board = boards[_boardId];

        // Require a non-zero pledge amount
        require(_amount > 0, "Pledge amount must be greater than 0");

        // Transfer tokens from the user to the contract
        board.rewardToken.transferFrom(msg.sender, address(this), _amount);

        // Update the total pledged amount for the board
        board.totalPledged += _amount;

        // Emit the TokensPledged event
        emit TokensPledged(_boardId, msg.sender, _amount);
    }

    // Function to participate in a bounty
    function participateInBounty(uint256 _boardId, uint256 _bountyId) public {
        // Get the bounty board and bounty from the `boards` mapping
        Board storage board = boards[_boardId];
        Bounty storage bounty = board.bounties[_bountyId];

        // Ensure the bounty is not completed and has not reached the maximum participants
        require(!bounty.completed, "Bounty is already completed");
        require(bounty.numParticipants < bounty.maxParticipants, "Bounty has reached maximum participants");
        require(!bounty.participants[msg.sender], "User is already participating in this bounty");

        // Add the participant to the bounty
        bounty.participants[msg.sender] = true;
        bounty.numParticipants++;

        // Check if the bounty has reached the maximum number of participants
        if (bounty.numParticipants == bounty.maxParticipants) {
            // Automatically complete the bounty
            bounty.completed = true;
            emit BountyCompleted(_boardId, _bountyId, msg.sender);
        }
    }

    // Function to update bounty details (only callable by the bounty creator)
    function updateBounty(
        uint256 _boardId,
        uint256 _bountyId,
        string memory _description,
        uint256 _deadline,
        uint256 _maxParticipants,
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
        bounty.maxParticipants = _maxParticipants;
        bounty.reviewers = _reviewers;
        bounty.rewardAmount = _rewardAmount;

        // Emit the BountyUpdated event
        emit BountyUpdated(_boardId, _bountyId);
    }

    // --- Upgradeability Functions ---

    function upgradeTo(address newImplementation) public {
        // Only the owner (creator of the first board) can upgrade
        require(msg.sender == boards[1].creator, "Only the owner can upgrade");

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