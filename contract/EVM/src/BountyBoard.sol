// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BoardStorage.sol";
import "./BoardView.sol";
import "./TaskManager.sol";
import "./SubmissionManager.sol";

contract BountyBoard is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    BoardStorage,
    BoardView,
    TaskManager,
    SubmissionManager
{
    event BountyBoardCreated(
        uint256 indexed boardId,
        address indexed creator,
        string name,
        string description,
        address rewardToken,
        uint256 createdAt,
        string config
    );

    event BountyBoardUpdated(
        uint256 indexed boardId,
        string name,
        string description,
        address rewardToken,
        string config
    );

    // Event emitted when a user joins a board
    event UserJoinedBoard(uint256 indexed boardId, address indexed user);

    // Event emitted when tokens are pledged to a bounty board
    event TokensPledged(
        uint256 indexed boardId,
        address indexed pledger,
        uint256 amount
    );

    // Event emitted when pledged tokens are withdrawn
    event TokensWithdrawn(
        uint256 indexed boardId,
        address indexed withdrawer,
        uint256 amount
    );

    // Event emitted when a bounty board is closed
    event BountyBoardClosed(uint256 indexed boardId);

    event ContractUpgraded(
        address indexed oldImplementation,
        address indexed newImplementation
    );

    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    address private _implementation;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _signerAddress) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        boardCount = 0;
        signerAddress = _signerAddress;
    }

    // Function to create a new bounty board
    function createBountyBoard(
        string memory _name,
        string memory _description,
        string memory _img,
        address _rewardToken,
        string memory _config
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
        newBoard.config = _config;

        _grantRole(REVIEWER_ROLE, msg.sender);

        emit BountyBoardCreated(
            boardCount,
            msg.sender,
            _name,
            _description,
            _rewardToken,
            block.timestamp,
            _config
        );

        boardCount++;
    }

    // Function to update bounty board details
    function updateBountyBoard(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        string memory _img,
        address _rewardToken,
        string memory _config
    ) public {
        Board storage board = boards[_boardId];
        require(
            msg.sender == board.creator,
            "Only the board creator can update the board"
        );

        board.name = _name;
        board.description = _description;
        board.img = _img;
        if (_rewardToken != address(0)) {
            board.rewardToken = IERC20(_rewardToken);
        }
        board.config = _config;

        emit BountyBoardUpdated(_boardId, _name, _description, _rewardToken, _config);
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

    // Function to check if a user is a board member
    function isBoardMember(
        uint256 _boardId,
        address _member
    ) public view override(BoardView, SubmissionManager) returns (bool) {
        return BoardView.isBoardMember(_boardId, _member);
    }

    // Function to set the signer address
    function setSignerAddress(address _newSignerAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newSignerAddress != address(0), "Invalid signer address");
        signerAddress = _newSignerAddress;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newImplementation != address(0), "New implementation cannot be zero address");
        require(newImplementation != address(this), "New implementation cannot be same as current");

        address currentImplementation = _implementation;

        emit ContractUpgraded(currentImplementation, newImplementation);
    }
}
