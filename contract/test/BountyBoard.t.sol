// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IBountyBoard} from "../src/IBountyBoard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract BountyBoardTest is Test {
    BountyBoard public bountyBoard;
    IERC20 public rewardToken;
    address public signerAddress;
    uint256 public signerPrivateKey;

    function setUp() public {
        // 设置签名者
        signerPrivateKey = 0xA11CE;
        signerAddress = vm.addr(signerPrivateKey);

        // 部署合约
        rewardToken = IERC20(address(new MockERC20("Test Token", "TEST")));

        // 部署实现合约
        BountyBoard implementation = new BountyBoard();

        // 准备初始化数据
        bytes memory initData = abi.encodeWithSelector(
            BountyBoard.initialize.selector,
            signerAddress
        );

        // 部署代理合约
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        // 获取代理合约实例
        bountyBoard = BountyBoard(payable(address(proxy)));
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
        string memory config = "{}";
        bool allowSelfCheck = true;

        bountyBoard.createTask(
            0,
            taskName,
            taskDescription,
            deadline,
            maxCompletions,
            rewardAmount,
            config,
            allowSelfCheck
        );

        // Get tasks using the view function instead of directly accessing the mapping
        BountyBoard.TaskView[] memory tasks = bountyBoard.getTasksForBoard(0);

        // Assert the first task's properties
        assertEq(tasks[0].name, taskName);
        assertEq(tasks[0].description, taskDescription);
        assertEq(tasks[0].deadline, deadline);
        assertEq(tasks[0].maxCompletions, maxCompletions);
        assertEq(tasks[0].rewardAmount, rewardAmount);
        assertEq(tasks[0].config, config);
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
        string memory newImg = "http://example.com/image2.png";
        address newRewardToken = address(1); // Example address

        bountyBoard.updateBountyBoard(0, newName, newDescription, newImg, newRewardToken);

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
        string memory config = "{}";
        bool allowSelfCheck = true;

        bountyBoard.createTask(
            0,
            taskName,
            taskDesc,
            deadline,
            maxCompletions,
            rewardAmount,
            config,
            allowSelfCheck
        );

        // 提交证明
        string memory proof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, proof);

        // 验证提交
        (
            address submitter,
            string memory submittedProof,
            int8 status,
            uint256 submittedAt,
            string memory reviewComment
        ) = bountyBoard.bountySubmissions(0, 0, address(this));
        assertEq(submitter, address(this));
        assertEq(submittedProof, proof);
    }

    function testReviewSubmission() public {
        // 创建板块和任务
        bountyBoard.createBountyBoard(
            "Test Board",
            "Test Description",
            "http://example.com/image.png",
            address(rewardToken)
        );

        bountyBoard.createTask(
            0,
            "Test Task",
            "Test Task Description",
            block.timestamp + 1 days,
            5, // maxCompletions
            100, // rewardAmount
            "{}",
            true // allowSelfCheck
        );

        // 质押代币
        MockERC20(address(rewardToken)).mint(address(this), 500);
        rewardToken.approve(address(bountyBoard), 500);
        bountyBoard.pledgeTokens(0, 500);

        // 提交证明
        string memory submissionProof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, submissionProof);

        // 直接进行审核（因创建者已经是审核者）
        bountyBoard.reviewSubmission(0, 0, address(this), 1, "Good job!");

        // 验证审核结果
        (
            address submitter,
            string memory proofResult,
            int8 status,
            uint256 _submittedAt,
            string memory reviewComment
        ) = bountyBoard.bountySubmissions(0, 0, address(this));

        assertEq(submitter, address(this));
        assertEq(proofResult, submissionProof);
        assertEq(status, 1);  // 1 表示已通过
        assertEq(reviewComment, "Good job!");
        assertTrue(_submittedAt > 0);
    }

    function testSelfCheckSubmission() public {
        // 创建板块和任务
        bountyBoard.createBountyBoard(
            "Test Board",
            "Test Description",
            "http://example.com/image.png",
            address(rewardToken)
        );

        bountyBoard.createTask(
            0,
            "Test Task",
            "Test Task Description",
            block.timestamp + 1 days,
            5, // maxCompletions
            100, // rewardAmount
            "{}",
            true // allowSelfCheck
        );

        // 质押代币
        MockERC20(address(rewardToken)).mint(address(this), 500); // 5 * 100
        rewardToken.approve(address(bountyBoard), 500);
        bountyBoard.pledgeTokens(0, 500);

        // 加入板块
        address user = makeAddr("user");
        vm.prank(user);
        bountyBoard.joinBoard(0);

        // 准备签名数据
        bytes32 messageHash = keccak256(abi.encode(
            uint256(0),
            uint256(0),
            user,
            "Task completed successfully"
        ));

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 提交自检
        vm.prank(user);
        bountyBoard.selfCheckSubmission(
            0,
            0,
            signature,
            "Task completed successfully"
        );

        // 验证提交结果
        (
            address submitter,
            string memory proofResult,
            int8 status,
            uint256 submittedAt,
            string memory reviewComment
        ) = bountyBoard.bountySubmissions(0, 0, user);

        // 验证结果
        assertEq(submitter, user);
        assertEq(proofResult, "Task completed successfully");
        assertEq(reviewComment, "Task completed successfully");
        assertTrue(submittedAt > 0);
    }

    function testSetSignerAddress() public {
        address newSigner = makeAddr("newSigner");
        bountyBoard.setSignerAddress(newSigner);
        assertEq(bountyBoard.signerAddress(), newSigner);
    }

    function testFailSetSignerAddressUnauthorized() public {
        address unauthorized = makeAddr("unauthorized");
        vm.prank(unauthorized);
        bountyBoard.setSignerAddress(unauthorized);
    }

    function testFailSelfCheckWithInvalidSignature() public {
        // 创建板块和任务
        string memory boardName = "Test Board";
        bountyBoard.createBountyBoard(boardName, "", "", address(rewardToken));
        bountyBoard.createTask(0, "Task", "", 0, 1, 100, "", true);

        // 使用错误的私钥签名
        uint256 wrongPrivateKey = 0xB0B;
        address user = makeAddr("user");
        string memory checkData = "Test";

        bytes32 messageHash = keccak256(abi.encode(0, 0, user, checkData));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(user);
        bountyBoard.joinBoard(0);

        vm.prank(user);
        bountyBoard.selfCheckSubmission(0, 0, signature, checkData);
    }

    function testUserTaskStatus() public {
        // 1. 创建板块
        bountyBoard.createBountyBoard(
            "Test Board",
            "Test Description",
            "http://example.com/image.png",
            address(rewardToken)
        );

        // 2. 创建两个任务
        bountyBoard.createTask(
            0,
            "Task 1",
            "Description 1",
            block.timestamp + 1 days,
            5,
            100,
            "{}",
            true
        );

        bountyBoard.createTask(
            0,
            "Task 2",
            "Description 2",
            block.timestamp + 1 days,
            5,
            100,
            "{}",
            true
        );

        // 3. 创建测试用户并加入板块
        address user = makeAddr("user");
        vm.startPrank(user);
        bountyBoard.joinBoard(0);

        // 4. 提交第一个任务的证明
        string memory proof1 = "Proof for task 1";
        bountyBoard.submitProof(0, 0, proof1);

        // 5. 获取板块详情并验证用户任务状态
        BountyBoard.BoardDetailView memory boardDetail = bountyBoard.getBoardDetail(0);

        // 打印调试信息
        console.log("Number of tasks:");
        console.logUint(boardDetail.tasks.length);
        console.log("Number of user task statuses:");
        console.logUint(boardDetail.userTaskStatuses.length);

        // 6. 验证用户任务状态数组长度
        assertEq(boardDetail.userTaskStatuses.length, 2, "Should have status for both tasks");

        // 7. 验证第一个任务的状态（已提交）
        BountyBoard.UserTaskStatus memory status1 = boardDetail.userTaskStatuses[0];
        console.log("Task 1 - TaskId:");
        console.logUint(uint256(status1.taskId));
        console.log("Task 1 - Submitted:");
        console.logBool(status1.submitted);
        console.log("Task 1 - Status:");
        console.logInt(status1.status);
        console.log("Task 1 - SubmittedAt:");
        console.logUint(status1.submittedAt);
        console.log("Task 1 - Proof:");
        console.log(status1.submitProof);

        assertEq(status1.taskId, 0, "Task ID should be 0");
        assertTrue(status1.submitted, "Task should be marked as submitted");
        assertEq(status1.status, 0, "Status should be pending (0)");
        assertTrue(status1.submittedAt > 0, "Submit time should be set");
        assertEq(status1.submitProof, proof1, "Proof should match submitted proof");
        assertEq(status1.reviewComment, "", "Review comment should be empty");

        // 8. 验证第二个任务的状态（未提交）
        BountyBoard.UserTaskStatus memory status2 = boardDetail.userTaskStatuses[1];
        console.log("Task 2 - TaskId:");
        console.logUint(uint256(status2.taskId));
        console.log("Task 2 - Submitted:");
        console.logBool(status2.submitted);
        console.log("Task 2 - Status:");
        console.logInt(status2.status);

        assertEq(status2.taskId, 1, "Task ID should be 1");
        assertFalse(status2.submitted, "Task should not be marked as submitted");
        assertEq(status2.status, 0, "Status should be 0");
        assertEq(status2.submittedAt, 0, "Submit time should be 0");
        assertEq(status2.submitProof, "", "Proof should be empty");
        assertEq(status2.reviewComment, "", "Review comment should be empty");

        // 在审核之前添加代币质押
        vm.stopPrank();  // 停止用户上下文
        MockERC20(address(rewardToken)).mint(address(this), 1000);
        rewardToken.approve(address(bountyBoard), 1000);
        bountyBoard.pledgeTokens(0, 1000);

        // 9. 测试审核后的状态变化
        bountyBoard.reviewSubmission(0, 0, user, 1, "Good job!");

        vm.prank(user);  // 切换回用户上下文查看结果
        boardDetail = bountyBoard.getBoardDetail(0);
        status1 = boardDetail.userTaskStatuses[0];

        console.log("After review - Status:");
        console.logInt(status1.status);
        console.log("After review - Review comment:");
        console.log(status1.reviewComment);

        assertEq(status1.status, 1, "Status should be approved (1)");
        assertEq(status1.reviewComment, "Good job!", "Review comment should be set");

        // 10. 测试重复提交已通过的任务
        vm.prank(user);
        vm.expectRevert("User has already been approved for this task");
        bountyBoard.submitProof(0, 0, "New proof");
    }

    function testUserTaskStatusWithMultipleSubmissions() public {
        // 1. 设置初始环境
        bountyBoard.createBountyBoard(
            "Test Board",
            "Test Description",
            "http://example.com/image.png",
            address(rewardToken)
        );

        bountyBoard.createTask(
            0,
            "Task 1",
            "Description 1",
            block.timestamp + 1 days,
            5,
            100,
            "{}",
            true
        );

        // 2. 创建多个用户并加入板块
        address[] memory users = new address[](3);
        for(uint i = 0; i < users.length; i++) {
            users[i] = makeAddr(string.concat("user", Strings.toString(i)));
            vm.prank(users[i]);
            bountyBoard.joinBoard(0);
        }

        // 3. 多个用户提交证明
        for(uint i = 0; i < users.length; i++) {
            vm.prank(users[i]);
            bountyBoard.submitProof(0, 0, string.concat("Proof from user ", Strings.toString(i)));

            // 获取并验证每个用户的提交状态
            vm.prank(users[i]);
            BountyBoard.BoardDetailView memory boardDetail = bountyBoard.getBoardDetail(0);
            BountyBoard.UserTaskStatus memory status = boardDetail.userTaskStatuses[0];

            console.log("User");
            console.logUint(i);
            console.log("- Submitted:");
            console.logBool(status.submitted);
            console.log("- Status:");
            console.logInt(status.status);
            console.log("- Proof:");
            console.log(status.submitProof);

            assertTrue(status.submitted, "Task should be marked as submitted");
            assertEq(status.status, 0, "Status should be pending (0)");
            assertTrue(status.submittedAt > 0, "Submit time should be set");
            assertEq(
                status.submitProof,
                string.concat("Proof from user ", Strings.toString(i)),
                "Proof should match"
            );
        }

        // 4. 审核不同状态
        int8[] memory reviewStatuses = new int8[](3);
        reviewStatuses[0] = 1;  // 通过
        reviewStatuses[1] = -1; // 拒绝
        reviewStatuses[2] = 0;  // 保持待定

        string[] memory comments = new string[](3);
        comments[0] = "Approved";
        comments[1] = "Rejected";
        comments[2] = "Still pending";

        // 在审核之前添加代币质押 (确保在正确的上下文中)
        MockERC20(address(rewardToken)).mint(address(this), 1000);
        rewardToken.approve(address(bountyBoard), 1000);
        bountyBoard.pledgeTokens(0, 1000);

        for(uint i = 0; i < users.length; i++) {
            bountyBoard.reviewSubmission(0, 0, users[i], reviewStatuses[i], comments[i]);

            // 验证审核后的状态
            vm.prank(users[i]);
            BountyBoard.BoardDetailView memory boardDetail = bountyBoard.getBoardDetail(0);
            BountyBoard.UserTaskStatus memory status = boardDetail.userTaskStatuses[0];

            console.log("After review - User");
            console.logUint(i);
            console.log("- Status:");
            console.logInt(status.status);
            console.log("- Comment:");
            console.log(status.reviewComment);

            assertEq(status.status, reviewStatuses[i], "Status should match review status");
            assertEq(status.reviewComment, comments[i], "Review comment should match");
        }
    }

    function testBoardViews() public {
        // 1. 创建板块
        string memory boardName = "Test Board";
        string memory boardDesc = "Test Description";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDesc, img, address(rewardToken));

        // 2. 创建任务
        bountyBoard.createTask(
            0,                              // boardId
            "Task 1",                       // name
            "Task 1 Description",           // description
            block.timestamp + 1 days,       // deadline
            5,                             // maxCompletions
            100,                           // rewardAmount
            "{}",                          // config
            true                           // allowSelfCheck
        );

        // 3. 添加成员
        address member = makeAddr("member");
        vm.prank(member);
        bountyBoard.joinBoard(0);

        // 4. 提交任务
        vm.prank(member);
        bountyBoard.submitProof(0, 0, "Test proof");

        // 5. 测试 getAllBoards
        console.log("Testing getAllBoards:");
        BountyBoard.BoardView[] memory allBoards = bountyBoard.getAllBoards();
        for(uint i = 0; i < allBoards.length; i++) {
            console.log("Board", i);
            console.log("- Name:", allBoards[i].name);
            console.log("- Description:", allBoards[i].description);
            console.log("- Creator:", allBoards[i].creator);
            console.log("- Total Pledged:", allBoards[i].totalPledged);
        }

        // 6. 测试 getTasksForBoard
        console.log("\nTesting getTasksForBoard:");
        BountyBoard.TaskView[] memory tasks = bountyBoard.getTasksForBoard(0);
        for(uint i = 0; i < tasks.length; i++) {
            console.log("Task", i);
            console.log("- Name:", tasks[i].name);
            console.log("- Description:", tasks[i].description);
            console.log("- Reward:", tasks[i].rewardAmount);
            console.log("- Completions:", tasks[i].numCompletions);
        }

        // 7. 测试 getBoardDetail
        console.log("\nTesting getBoardDetail:");
        vm.prank(member);  // 使用成员身份查看
        BountyBoard.BoardDetailView memory detail = bountyBoard.getBoardDetail(0);

        console.log("Board Detail:");
        console.log("- Name:", detail.name);
        console.log("- Description:", detail.description);
        console.log("- Total Tasks:", detail.tasks.length);
        console.log("- Total Submissions:", detail.submissions.length);
        console.log("- Total Members:", detail.members.length);

        console.log("\nUser Task Statuses:");
        for(uint i = 0; i < detail.userTaskStatuses.length; i++) {
            console.log("Task", i);
            console.log("- Submitted:", detail.userTaskStatuses[i].submitted);
            console.log("- Status:", detail.userTaskStatuses[i].status);
            console.log("- Proof:", detail.userTaskStatuses[i].submitProof);
        }

        // 8. 测试 getBoardsByMember
        console.log("\nTesting getBoardsByMember:");
        BountyBoard.BoardView[] memory memberBoards = bountyBoard.getBoardsByMember(member);
        for(uint i = 0; i < memberBoards.length; i++) {
            console.log("Board", i);
            console.log("- Name:", memberBoards[i].name);
            console.log("- Description:", memberBoards[i].description);
        }

        // 9. 验证数据正确性
        assertEq(allBoards.length, 1, "Should have one board");
        assertEq(tasks.length, 1, "Should have one task");
        assertEq(detail.members.length, 2, "Should have two members");
        assertEq(memberBoards.length, 1, "Member should be in one board");
    }
}
