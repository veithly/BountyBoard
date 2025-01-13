// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Script, console} from "forge-std/Script.sol";
import {UserProfile} from "../src/UserProfile.sol";

contract UserProfileScript is Script {
    function setUp() public {}

    function run() public {
        // 从环境变量获取必要参数
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address signerAddress = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 部署合约
        UserProfile userProfile = new UserProfile(signerAddress);
        console.log("UserProfile deployed at:", address(userProfile));
        console.log("Signer address set to:", userProfile.signerAddress());

        vm.stopBroadcast();
    }
}