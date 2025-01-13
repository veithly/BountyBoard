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
        // Set the signer
        signerPrivateKey = 0xA11CE;
        signerAddress = vm.addr(signerPrivateKey);

        // Deploy contract
        rewardToken = IERC20(address(new MockERC20("Test Token", "TEST")));

        // Deploy the implementation contract
        BountyBoard implementation = new BountyBoard();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            BountyBoard.initialize.selector,
            signerAddress
        );

        // Deploy the proxy contract
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        // Get the proxy contract instance
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
        // Create a new test account instead of using the current account.
        address user = makeAddr("user");
        vm.startPrank(user);

        // Create a section/forum/board
        string memory boardName = "Test Board";
        string memory boardDescription = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDescription, img, address(rewardToken));

        // Join the section with different accounts
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
        // Create a section/forum/board
        string memory initialName = "Test Board";
        string memory initialDesc = "This is a test board";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(initialName, initialDesc, img, address(rewardToken));

        // If using ERC20 tokens, you need to approve first.
        if (address(rewardToken) != address(0)) {
            MockERC20(address(rewardToken)).approve(address(bountyBoard), type(uint256).max);
        }

        uint256 pledgeAmount = 1000;
        // If it is a native token, the value needs to be sent.
        if (address(rewardToken) == address(0)) {
            bountyBoard.pledgeTokens{value: pledgeAmount}(0, pledgeAmount);
        } else {
            bountyBoard.pledgeTokens(0, pledgeAmount);
        }

        (,,,,,, uint256 totalPledged,,) = bountyBoard.boards(0);
        assertEq(totalPledged, pledgeAmount);
    }

    function testSubmitProof() public {
        // Create sections and tasks
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

        // Submit proof
        string memory proof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, proof);

        // Verify submission
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
        // Create sections and tasks
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

        // Pledged tokens
        MockERC20(address(rewardToken)).mint(address(this), 500);
        rewardToken.approve(address(bountyBoard), 500);
        bountyBoard.pledgeTokens(0, 500);

        // Submit proof
        string memory submissionProof = "http://example.com/proof";
        bountyBoard.submitProof(0, 0, submissionProof);

        // Directly proceed to review (as the creator is already a reviewer)
        bountyBoard.reviewSubmission(0, 0, address(this), 1, "Good job!");

        // Verify audit results
        (
            address submitter,
            string memory proofResult,
            int8 status,
            uint256 _submittedAt,
            string memory reviewComment
        ) = bountyBoard.bountySubmissions(0, 0, address(this));

        assertEq(submitter, address(this));
        assertEq(proofResult, submissionProof);
        assertEq(status, 1);  // 1 indicates passed
        assertEq(reviewComment, "Good job!");
        assertTrue(_submittedAt > 0);
    }

    function testSelfCheckSubmission() public {
        // Create sections and tasks
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

        // Pledged tokens
        MockERC20(address(rewardToken)).mint(address(this), 500); // 5 * 100
        rewardToken.approve(address(bountyBoard), 500);
        bountyBoard.pledgeTokens(0, 500);

        // Add a section/board
        address user = makeAddr("user");
        vm.prank(user);
        bountyBoard.joinBoard(0);

        // Prepare signature data
        bytes32 messageHash = keccak256(abi.encode(
            uint256(0),
            uint256(0),
            user,
            "Task completed successfully"
        ));

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Submit self-inspection
        vm.prank(user);
        bountyBoard.selfCheckSubmission(
            0,
            0,
            signature,
            "Task completed successfully"
        );

        // Verify submission result
        (
            address submitter,
            string memory proofResult,
            int8 status,
            uint256 submittedAt,
            string memory reviewComment
        ) = bountyBoard.bountySubmissions(0, 0, user);

        // Verify the result
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
        // Create sections and tasks
        string memory boardName = "Test Board";
        bountyBoard.createBountyBoard(boardName, "", "", address(rewardToken));
        bountyBoard.createTask(0, "Task", "", 0, 1, 100, "", true);

        // Using the wrong private key to sign
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
        // 1. Create a section/forum/board
        bountyBoard.createBountyBoard(
            "Test Board",
            "Test Description",
            "http://example.com/image.png",
            address(rewardToken)
        );

        // 2. Create two tasks
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

        // 3. Create test users and add them to the section.
        address user = makeAddr("user");
        vm.startPrank(user);
        bountyBoard.joinBoard(0);

        // 4. Submit the proof of the first task.
        string memory proof1 = "Proof for task 1";
        bountyBoard.submitProof(0, 0, proof1);

        // 5. Get section details and verify user task status.
        BountyBoard.BoardDetailView memory boardDetail = bountyBoard.getBoardDetail(0);

        // Print debug information
        console.log("Number of tasks:");
        console.logUint(boardDetail.tasks.length);
        console.log("Number of user task statuses:");
        console.logUint(boardDetail.userTaskStatuses.length);

        // 6. Verify the length of the user task status array.
        assertEq(boardDetail.userTaskStatuses.length, 2, "Should have status for both tasks");

        // 7. Verify the status of the first task (submitted)
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

        // 8. Verify the status of the second task (not submitted)
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

        // Add token staking before review.
        vm.stopPrank();  // Stop user context
        MockERC20(address(rewardToken)).mint(address(this), 1000);
        rewardToken.approve(address(bountyBoard), 1000);
        bountyBoard.pledgeTokens(0, 1000);

        // 9. Test the status change after audit.
        bountyBoard.reviewSubmission(0, 0, user, 1, "Good job!");

        vm.prank(user);  // Switch back to the user context to view the results
        boardDetail = bountyBoard.getBoardDetail(0);
        status1 = boardDetail.userTaskStatuses[0];

        console.log("After review - Status:");
        console.logInt(status1.status);
        console.log("After review - Review comment:");
        console.log(status1.reviewComment);

        assertEq(status1.status, 1, "Status should be approved (1)");
        assertEq(status1.reviewComment, "Good job!", "Review comment should be set");

        // 10. Test resubmission of tasks that have already been passed.
        vm.prank(user);
        vm.expectRevert("User has already been approved for this task");
        bountyBoard.submitProof(0, 0, "New proof");
    }

    function testUserTaskStatusWithMultipleSubmissions() public {
        // 1. Set initial environment
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

        // 2. Create multiple users and add them to the section.
        address[] memory users = new address[](3);
        for(uint i = 0; i < users.length; i++) {
            users[i] = makeAddr(string.concat("user", Strings.toString(i)));
            vm.prank(users[i]);
            bountyBoard.joinBoard(0);
        }

        // 3. Multiple users submit proofs.
        for(uint i = 0; i < users.length; i++) {
            vm.prank(users[i]);
            bountyBoard.submitProof(0, 0, string.concat("Proof from user ", Strings.toString(i)));

            // Get and verify the submission status of each user.
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

        // 4. Review different statuses
        int8[] memory reviewStatuses = new int8[](3);
        reviewStatuses[0] = 1;  // Through
        reviewStatuses[1] = -1; // Refuse
        reviewStatuses[2] = 0;  // Keep pending

        string[] memory comments = new string[](3);
        comments[0] = "Approved";
        comments[1] = "Rejected";
        comments[2] = "Still pending";

        // Add token staking before review (ensure in the correct context)
        MockERC20(address(rewardToken)).mint(address(this), 1000);
        rewardToken.approve(address(bountyBoard), 1000);
        bountyBoard.pledgeTokens(0, 1000);

        for(uint i = 0; i < users.length; i++) {
            bountyBoard.reviewSubmission(0, 0, users[i], reviewStatuses[i], comments[i]);

            // Verify the status after review.
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
        // 1. Create a section/forum/board
        string memory boardName = "Test Board";
        string memory boardDesc = "Test Description";
        string memory img = "http://example.com/image.png";
        bountyBoard.createBountyBoard(boardName, boardDesc, img, address(rewardToken));

        // 2. Create task
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

        // 3. Add member
        address member = makeAddr("member");
        vm.prank(member);
        bountyBoard.joinBoard(0);

        // 4. Submit task
        vm.prank(member);
        bountyBoard.submitProof(0, 0, "Test proof");

        // 5. Test getAllBoards
        console.log("Testing getAllBoards:");
        BountyBoard.BoardView[] memory allBoards = bountyBoard.getAllBoards();
        for(uint i = 0; i < allBoards.length; i++) {
            console.log("Board", i);
            console.log("- Name:", allBoards[i].name);
            console.log("- Description:", allBoards[i].description);
            console.log("- Creator:", allBoards[i].creator);
            console.log("- Total Pledged:", allBoards[i].totalPledged);
        }

        // 6. Test getTasksForBoard
        console.log("\nTesting getTasksForBoard:");
        BountyBoard.TaskView[] memory tasks = bountyBoard.getTasksForBoard(0);
        for(uint i = 0; i < tasks.length; i++) {
            console.log("Task", i);
            console.log("- Name:", tasks[i].name);
            console.log("- Description:", tasks[i].description);
            console.log("- Reward:", tasks[i].rewardAmount);
            console.log("- Completions:", tasks[i].numCompletions);
        }

        // 7. Test getBoardDetail
        console.log("\nTesting getBoardDetail:");
        vm.prank(member);  // Use membership to view
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

        // 8. Test getBoardsByMember
        console.log("\nTesting getBoardsByMember:");
        BountyBoard.BoardView[] memory memberBoards = bountyBoard.getBoardsByMember(member);
        for(uint i = 0; i < memberBoards.length; i++) {
            console.log("Board", i);
            console.log("- Name:", memberBoards[i].name);
            console.log("- Description:", memberBoards[i].description);
        }

        // 9. Verify data correctness
        assertEq(allBoards.length, 1, "Should have one board");
        assertEq(tasks.length, 1, "Should have one task");
        assertEq(detail.members.length, 2, "Should have two members");
        assertEq(memberBoards.length, 1, "Member should be in one board");
    }
}
