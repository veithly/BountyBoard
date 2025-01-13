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

        // 1. Deploy the implementation contract
        BountyBoard implementation = new BountyBoard();
        console.log("Implementation deployed at:", address(implementation));

        // Ensure the implementation contract is deployed correctly.
        require(address(implementation) != address(0), "Implementation deployment failed");

        // 3. Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            BountyBoard.initialize.selector,
            signerAddress
        );
        console.log("Initialize data length:", initData.length);

        if (upgradeAddress != address(0)) {
            // If the upgrade address is defined, proceed with contract upgrade.
            console.log("Upgrading contract at address:", upgradeAddress);
            UUPSUpgradeable proxy = UUPSUpgradeable(upgradeAddress);
            proxy.upgradeToAndCall(address(implementation), "");
            console.log("Contract upgraded at:", upgradeAddress);
        } else {
            // Otherwise, create a new proxy contract.
            ERC1967Proxy proxy = new ERC1967Proxy(
                address(implementation),
                initData
            );
            console.log("Proxy deployed at:", address(proxy));

            // 5. Create an interface instance of the proxy contract and verify initialization.
            BountyBoard bountyBoard = BountyBoard(payable(address(proxy)));
            require(bountyBoard.signerAddress() == signerAddress, "Initialization verification failed");

            console.log("BountyBoard (proxy) initialized at:", address(bountyBoard));
            console.log("Signer address set to:", bountyBoard.signerAddress());
        }

        vm.stopBroadcast();
    }
}
