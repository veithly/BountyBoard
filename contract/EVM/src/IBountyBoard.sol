// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IBountyBoard {
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
        uint256 config;
        bool allowSelfCheck;
    }
}
