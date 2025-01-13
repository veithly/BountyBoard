// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BoardStorage {

    struct Board {
        uint256 id;
        address creator;
        string name;
        string description;
        string img;
        Task[] tasks;
        IERC20 rewardToken;
        uint256 totalPledged;
        address[] members;
        uint256 createdAt;
        bool closed;
        string config;
    }

    struct Task {
        uint256 id;
        string name;
        address creator;
        string description;
        uint256 deadline;
        uint256 maxCompletions;
        uint256 numCompletions;
        address[] reviewers;
        bool completed;
        uint256 rewardAmount;
        uint256 createdAt;
        bool cancelled;
        string config;
        bool allowSelfCheck;
    }

    struct Submission {
        address submitter;
        string proof;
        int8 status;
        uint256 submittedAt;
        string reviewComment;
    }

    mapping(uint256 => Board) public boards;
    uint256 public boardCount;
    mapping(uint256 => mapping(uint256 => mapping(address => Submission))) public bountySubmissions;
    address public signerAddress;
}