// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BountyBoardScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address signerAddress = vm.envAddress("SIGNER_ADDRESS");
        address upgradeAddress = vm.envAddress("UPGRADE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署实现合约
        BountyBoard implementation = new BountyBoard();
        console.log("Implementation deployed at:", address(implementation));

        // 2. 确保实现合约已正确部署
        require(address(implementation) != address(0), "Implementation deployment failed");

        // 3. 准备初始化数据
        bytes memory initData = abi.encodeWithSelector(
            BountyBoard.initialize.selector,
            signerAddress
        );
        console.log("Initialize data length:", initData.length);

        if (upgradeAddress != address(0)) {
            // 如果定义了升级地址，则进行合约升级
            console.log("Upgrading contract at address:", upgradeAddress);
            UUPSUpgradeable proxy = UUPSUpgradeable(upgradeAddress);
            proxy.upgradeToAndCall(address(implementation), "");
            console.log("Contract upgraded at:", upgradeAddress);
        } else {
            // 否则，创建新的代理合约
            ERC1967Proxy proxy = new ERC1967Proxy(
                address(implementation),
                initData
            );
            console.log("Proxy deployed at:", address(proxy));

            // 5. 创建代理合约的接口实例并验证初始化
            BountyBoard bountyBoard = BountyBoard(payable(address(proxy)));
            require(bountyBoard.signerAddress() == signerAddress, "Initialization verification failed");

            console.log("BountyBoard (proxy) initialized at:", address(bountyBoard));
            console.log("Signer address set to:", bountyBoard.signerAddress());
        }

        vm.stopBroadcast();
    }
}
