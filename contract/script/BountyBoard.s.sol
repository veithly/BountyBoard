// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract BountyBoardScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address signerAddress = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署实现合约
        BountyBoard implementation = new BountyBoard();
        console.log("Implementation deployed at:", address(implementation));

        // 2. 准备初始化数据
        bytes memory initData = abi.encodeWithSelector(
            BountyBoard.initialize.selector,
            signerAddress
        );

        // 3. 部署代理合约
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));

        // 4. 创建代理合约的接口实例
        BountyBoard bountyBoard = BountyBoard(payable(address(proxy)));
        console.log("BountyBoard (proxy) initialized at:", address(bountyBoard));
        console.log("Signer address set to:", bountyBoard.signerAddress());

        vm.stopBroadcast();
    }
}
