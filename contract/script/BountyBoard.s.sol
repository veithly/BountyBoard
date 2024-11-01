// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

contract BountyBoardScript is Script {
    BountyBoard public bountyBoard;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        bountyBoard = new BountyBoard();
        bountyBoard.initialize();

        console.log("BountyBoard deployed at:", address(bountyBoard));

        vm.stopBroadcast();
    }
}
