// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract MintTokenScript is Script {
    function run() external {
        // Start broadcasting the transaction
        vm.startBroadcast();

        // Address of the deployed contract (use the existing address if it has already been deployed)
        address tokenAddress = 0xaEbAfCa968c845bD69206Ba3c61cFbf59D123A23;
        MockERC20 token = MockERC20(tokenAddress);

        // Mint tokens to a specified address
        address recipient = 0x9DB42275a5F1752392b31D4E9Af2D7A318263887;
        uint256 amount = 1000000000000 * 10**18; // mint 1000 tokens
        token.mint(recipient, amount);

        vm.stopBroadcast();
    }
}