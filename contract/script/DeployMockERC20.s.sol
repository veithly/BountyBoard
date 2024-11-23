// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract DeployMockERC20Script is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_LINEA");
        vm.startBroadcast(deployerPrivateKey);

        MockERC20 token = new MockERC20("DOG", "DOG");
        console.log("Token deployed at:", address(token));

        vm.stopBroadcast();
    }
}