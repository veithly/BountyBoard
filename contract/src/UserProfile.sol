// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract UserProfile is Ownable, EIP712 {
    using ECDSA for bytes32;

    struct Profile {
        string nickname;
        string avatar;
        string socialAccount;
        uint256 updatedAt;
        bool exists;
    }

    mapping(address => Profile) private profiles;
    address[] private userAddresses;
    address public signerAddress;

    event ProfileUpdated(
        address indexed user,
        string nickname,
        string avatar,
        string socialAccount
    );

    error ProfileNotFound();
    error InvalidAddress();
    error InvalidSignature();

    constructor(
        address _signerAddress
    ) Ownable(msg.sender) EIP712("UserProfile", "1") {
        signerAddress = _signerAddress;
    }

    function setSignerAddress(address _newSignerAddress) external onlyOwner {
        require(_newSignerAddress != address(0), "Invalid signer address");
        signerAddress = _newSignerAddress;
    }

    function setProfile(
        string memory nickname,
        string memory avatar,
        string memory socialAccount,
        bytes memory signature
    ) external {
        // Verify signature
        bytes32 digest = keccak256(
            abi.encode(nickname, avatar, socialAccount, msg.sender)
        );

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            digest
        );

        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        if (signer != signerAddress) revert InvalidSignature();

        if (!profiles[msg.sender].exists) {
            userAddresses.push(msg.sender);
        }

        profiles[msg.sender] = Profile({
            nickname: nickname,
            avatar: avatar,
            socialAccount: socialAccount,
            updatedAt: block.timestamp,
            exists: true
        });

        emit ProfileUpdated(msg.sender, nickname, avatar, socialAccount);
    }

    function getProfile(
        address user
    )
        external
        view
        returns (
            string memory nickname,
            string memory avatar,
            string memory socialAccount,
            uint256 updatedAt
        )
    {
        if (!profiles[user].exists) revert ProfileNotFound();

        Profile memory profile = profiles[user];
        return (
            profile.nickname,
            profile.avatar,
            profile.socialAccount,
            profile.updatedAt
        );
    }

    function getProfiles(
        address[] calldata users
    )
        external
        view
        returns (
            string[] memory nicknames,
            string[] memory avatars,
            string[] memory socialAccounts,
            uint256[] memory updatedAts,
            bool[] memory exists
        )
    {
        uint256 length = users.length;
        nicknames = new string[](length);
        avatars = new string[](length);
        socialAccounts = new string[](length);
        updatedAts = new uint256[](length);
        exists = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            if (users[i] == address(0)) revert InvalidAddress();

            Profile memory profile = profiles[users[i]];
            if (profile.exists) {
                nicknames[i] = profile.nickname;
                avatars[i] = profile.avatar;
                socialAccounts[i] = profile.socialAccount;
                updatedAts[i] = profile.updatedAt;
                exists[i] = true;
            }
        }
    }

    function getAllUsers() external view returns (address[] memory) {
        return userAddresses;
    }

    function getUserCount() external view returns (uint256) {
        return userAddresses.length;
    }
}
