// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Script, console} from "forge-std/Script.sol";
import {SocialBindingPortal} from "../src/SocialBindingPortal.sol";

contract DeploySocialBinding is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_LINEA");
        address signerAddress = vm.envAddress("SIGNER_ADDRESS");

        vm.broadcast(deployerPrivateKey);

        // 部署合约
        address[] memory modules = new address[](0);
        address router = vm.envAddress("VERAX_ROUTER_ADDRESS");

        // 添加 gas 参数
        uint256 gasLimit = 3000000;
        uint256 gasPrice = 500000000; // 0.5 gwei

        bytes memory constructorArgs = abi.encode(modules, router, signerAddress);
        bytes memory bytecode = abi.encodePacked(
            type(SocialBindingPortal).creationCode,
            constructorArgs
        );

        address deployedAddress;
        assembly {
            deployedAddress := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        require(deployedAddress != address(0), "Deploy failed");

        console.log("SocialBindingPortal deployed at:", deployedAddress);
        console.log("Signer address set to:", SocialBindingPortal(deployedAddress).signerAddress());
    }
}