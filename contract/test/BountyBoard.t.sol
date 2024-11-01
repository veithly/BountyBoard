// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBountyBoard} from "../src/IBountyBoard.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract BountyBoardTest is Test {
    BountyBoard public bountyBoard;
    IERC20 public rewardToken;

    function setUp() public {
        rewardToken = IERC20(address(new MockERC20("Test Token", "TEST")));
        bountyBoard = new BountyBoard();
    }

    function testCreateBountyBoard() public {
        string memory name = "Test Board";
        string memory description = "This is a test board";
        string memory img = "http://example.com/image.png";

        bountyBoard.createBountyBoard(name, description, img, address(rewardToken));

        (uint256 id, address creator, string memory boardName, string memory boardDescription, , , , , ) = bountyBoard.boards(0);

        assertEq(id, 0);
        assertEq(creator, address(this));
        assertEq(boardName, name);
        assertEq(boardDescription, description);
    }

    function testCreateTask() public {
        // Create board first
        string memory boardName = "Test Board";
        string memory boardDescription = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDescription, img, address(rewardToken));

        // Create task
        string memory taskName = "Test Task";
        string memory taskDescription = "This is a test task";
        uint256 deadline = block.timestamp + 1 days;
        uint256 maxCompletions = 5;
        uint256 rewardAmount = 100;

        bountyBoard.createTask(0, taskName, taskDescription, deadline, maxCompletions, rewardAmount);

        // Get tasks using the view function instead of directly accessing the mapping
        BountyBoard.TaskView[] memory tasks = bountyBoard.getTasksForBoard(0);

        // Assert the first task's properties
        assertEq(tasks[0].name, taskName);
        assertEq(tasks[0].description, taskDescription);
        assertEq(tasks[0].deadline, deadline);
        assertEq(tasks[0].maxCompletions, maxCompletions);
        assertEq(tasks[0].rewardAmount, rewardAmount);
    }

    function testJoinBoard() public {
        // 创建新的测试账户而不是使用当前账户
        address user = makeAddr("user");
        vm.startPrank(user);

        // 创建板块
        string memory boardName = "Test Board";
        string memory boardDescription = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDescription, img, address(rewardToken));

        // 使用不同的账户加入板块
        vm.stopPrank();
        vm.prank(makeAddr("joiner"));
        bountyBoard.joinBoard(0);
    }

    function testUpdateBountyBoard() public {
        // First create a board
        string memory initialName = "Test Board";
        string memory initialDesc = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(initialName, initialDesc, img, address(rewardToken));

        // Update the board
        string memory newName = "Updated Board";
        string memory newDescription = "Updated description";
        address newRewardToken = address(1); // Example address

        bountyBoard.updateBountyBoard(0, newName, newDescription, newRewardToken);

        // Get board details using tuple destructuring
        (
            ,  // id
            ,  // creator
            string memory returnedName,
            string memory returnedDesc,
            ,  // img
            IERC20 returnedToken,
            ,  // totalPledged
            ,  // createdAt
            // closed
        ) = bountyBoard.boards(0);

        assertEq(returnedName, newName);
        assertEq(returnedDesc, newDescription);
        assertEq(address(returnedToken), newRewardToken);
    }

    function testPledgeTokens() public {
        // 创建板块
        string memory initialName = "Test Board";
        string memory initialDesc = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(initialName, initialDesc, img, address(rewardToken));

        // 如果使用 ERC20 代币，需要先 approve
        if (address(rewardToken) != address(0)) {
            MockERC20(address(rewardToken)).approve(address(bountyBoard), type(uint256).max);
        }

        uint256 pledgeAmount = 1000;
        // 如果是原生代币，需要发送 value
        if (address(rewardToken) == address(0)) {
            bountyBoard.pledgeTokens{value: pledgeAmount}(0, pledgeAmount);
        } else {
            bountyBoard.pledgeTokens(0, pledgeAmount);
        }

        (,,,,,, uint256 totalPledged,,) = bountyBoard.boards(0);
        assertEq(totalPledged, pledgeAmount);
    }

    function testSubmitProof() public {
        // 创建板块和任务
        string memory boardName = "Test Board";
        string memory boardDesc = "Test Description";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDesc, img, address(rewardToken));

        string memory taskName = "Test Task";
        string memory taskDesc = "Test Task Description";
        uint256 deadline = block.timestamp + 1 days;
        uint256 maxCompletions = 5;
        uint256 rewardAmount = 100;
        bountyBoard.createTask(0, taskName, taskDesc, deadline, maxCompletions, rewardAmount);

        // 提交证明
        string memory proof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, proof);

        // 验证提交
        (address submitter, string memory submittedProof, , , ) = bountyBoard.bountySubmissions(0, 0, address(this));
        assertEq(submitter, address(this));
        assertEq(submittedProof, proof);
    }

    function testReviewSubmission() public {
        // 创建板块
        string memory boardName = "Test Board";
        string memory boardDescription = "Test Description";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDescription, img, address(rewardToken));

        // 创建任务
        string memory taskName = "Test Task";
        string memory taskDesc = "Test Task Description";
        uint256 deadline = block.timestamp + 1 days;
        uint256 maxCompletions = 5;
        uint256 rewardAmount = 100;
        bountyBoard.createTask(0, taskName, taskDesc, deadline, maxCompletions, rewardAmount);

        // 质押足够的代币用于奖励
        uint256 pledgeAmount = rewardAmount * maxCompletions;
        MockERC20(address(rewardToken)).mint(address(this), pledgeAmount);
        rewardToken.approve(address(bountyBoard), pledgeAmount);
        bountyBoard.pledgeTokens(0, pledgeAmount);

        // 提交证明
        string memory proof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, proof);

        // 添加审核者并审核提交
        bountyBoard.addReviewerToTask(0, 0, address(this));
        bountyBoard.reviewSubmission(0, 0, address(this), true);

        // 验证审核结果
        (, , bool reviewed, bool approved, ) = bountyBoard.bountySubmissions(0, 0, address(this));
        assertTrue(reviewed);
        assertTrue(approved);
    }
}
