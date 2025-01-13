// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Test, console} from "forge-std/Test.sol";
import {UserProfile} from "../src/UserProfile.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract UserProfileTest is Test {
    UserProfile public userProfile;
    address public signerAddress;
    uint256 public signerPrivateKey;

    function setUp() public {
        // Set the signer
        signerPrivateKey = 0xA11CE;
        signerAddress = vm.addr(signerPrivateKey);

        // Deploy contract
        userProfile = new UserProfile(signerAddress);
    }

    function testSetProfile() public {
        string memory nickname = "Alice";
        string memory avatar = "avatar_url";
        string memory socialAccount = "@alice";

        // Prepare signature data
        bytes32 messageHash = keccak256(
            abi.encode(
                keccak256(bytes(nickname)),
                keccak256(bytes(avatar)),
                keccak256(bytes(socialAccount)),
                address(this)
            )
        );

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            signerPrivateKey,
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        // Set profile
        userProfile.setProfile(nickname, avatar, socialAccount, signature);

        // Verify profile
        (
            string memory returnedNickname,
            string memory returnedAvatar,
            string memory returnedSocialAccount,
            uint256 updatedAt
        ) = userProfile.getProfile(address(this));

        assertEq(returnedNickname, nickname);
        assertEq(returnedAvatar, avatar);
        assertEq(returnedSocialAccount, socialAccount);
        assertTrue(updatedAt > 0);
    }

    function testGetProfiles() public {
        // Create multiple users and set up profiles.
        address[] memory users = new address[](3);
        string[] memory nicknames = new string[](3);
        string[] memory avatars = new string[](3);
        string[] memory socialAccounts = new string[](3);

        for (uint256 i = 0; i < 3; i++) {
            users[i] = address(uint160(i + 1));
            nicknames[i] = string(abi.encodePacked("User", vm.toString(i + 1)));
            avatars[i] = string(abi.encodePacked("avatar", vm.toString(i + 1)));
            socialAccounts[i] = string(
                abi.encodePacked("@user", vm.toString(i + 1))
            );

            // Prepare signature
            bytes32 messageHash = keccak256(
                abi.encode(
                    keccak256(bytes(nicknames[i])),
                    keccak256(bytes(avatars[i])),
                    keccak256(bytes(socialAccounts[i])),
                    users[i]
                )
            );

            bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
                messageHash
            );

            (uint8 v, bytes32 r, bytes32 s) = vm.sign(
                signerPrivateKey,
                ethSignedMessageHash
            );
            bytes memory signature = abi.encodePacked(r, s, v);

            // Set profile
            vm.prank(users[i]);
            userProfile.setProfile(
                nicknames[i],
                avatars[i],
                socialAccounts[i],
                signature
            );
        }

        // Batch retrieve profiles
        (
            string[] memory returnedNicknames,
            string[] memory returnedAvatars,
            string[] memory returnedSocialAccounts,
            uint256[] memory returnedUpdatedAts,
            bool[] memory exists
        ) = userProfile.getProfiles(users);

        // Verify the result
        for (uint256 i = 0; i < 3; i++) {
            assertEq(returnedNicknames[i], nicknames[i]);
            assertEq(returnedAvatars[i], avatars[i]);
            assertEq(returnedSocialAccounts[i], socialAccounts[i]);
            assertTrue(returnedUpdatedAts[i] > 0);
            assertTrue(exists[i]);
        }
    }

    function testGetAllUsers() public {
        // Create multiple user profiles
        address[] memory users = new address[](3);
        for (uint256 i = 0; i < 3; i++) {
            users[i] = address(uint160(i + 1));
            string memory nickname = string(
                abi.encodePacked("User", vm.toString(i + 1))
            );
            string memory avatar = string(
                abi.encodePacked("avatar", vm.toString(i + 1))
            );
            string memory socialAccount = string(
                abi.encodePacked("@user", vm.toString(i + 1))
            );

            // Prepare signature
            bytes32 messageHash = keccak256(
                abi.encode(
                    keccak256(bytes(nickname)),
                    keccak256(bytes(avatar)),
                    keccak256(bytes(socialAccount)),
                    users[i]
                )
            );

            bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
                messageHash
            );

            (uint8 v, bytes32 r, bytes32 s) = vm.sign(
                signerPrivateKey,
                ethSignedMessageHash
            );
            bytes memory signature = abi.encodePacked(r, s, v);

            // Set profile
            vm.prank(users[i]);
            userProfile.setProfile(nickname, avatar, socialAccount, signature);
        }

        // Get all users
        address[] memory allUsers = userProfile.getAllUsers();
        assertEq(allUsers.length, 3);

        // Verify user count
        assertEq(userProfile.getUserCount(), 3);

        // Verify user address
        for (uint256 i = 0; i < 3; i++) {
            assertEq(allUsers[i], users[i]);
        }
    }

    function testSetSignerAddress() public {
        address newSigner = makeAddr("newSigner");
        userProfile.setSignerAddress(newSigner);
        assertEq(userProfile.signerAddress(), newSigner);
    }

    function testFailSetSignerAddressUnauthorized() public {
        address unauthorized = makeAddr("unauthorized");
        vm.prank(unauthorized);
        userProfile.setSignerAddress(unauthorized);
    }

    function testFailSetProfileWithInvalidSignature() public {
        string memory nickname = "Alice";
        string memory avatar = "avatar_url";
        string memory socialAccount = "@alice";

        // Using the wrong private key to sign
        uint256 wrongPrivateKey = 0xB0B;
        bytes32 messageHash = keccak256(
            abi.encode(
                keccak256(bytes(nickname)),
                keccak256(bytes(avatar)),
                keccak256(bytes(socialAccount)),
                address(this)
            )
        );

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            wrongPrivateKey,
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        userProfile.setProfile(nickname, avatar, socialAccount, signature);
    }

    function testFailGetNonExistentProfile() public {
        address nonExistentUser = makeAddr("nonExistent");
        userProfile.getProfile(nonExistentUser);
    }

    function testGetProfilesWithInvalidAddress() public {
        address[] memory users = new address[](1);
        users[0] = address(0);

        vm.expectRevert(UserProfile.InvalidAddress.selector);
        userProfile.getProfiles(users);
    }
}