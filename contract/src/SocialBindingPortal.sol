// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AbstractPortal} from "../lib/linea-attestation-registry/contracts/src/abstracts/AbstractPortal.sol";
import {AttestationPayload} from "../lib/linea-attestation-registry/contracts/src/types/Structs.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SocialBindingPortal is AbstractPortal, Ownable {

    address public signerAddress;

    error SenderIsNotSubject();
    error InvalidSignature();

    constructor(
        address[] memory modules,
        address router,
        address _signerAddress
    ) AbstractPortal(modules, router) Ownable(msg.sender) {
        signerAddress = _signerAddress;
    }

    function setSignerAddress(address _newSignerAddress) external onlyOwner {
        require(_newSignerAddress != address(0), "Invalid signer address");
        signerAddress = _newSignerAddress;
    }

    function _onAttest(
        AttestationPayload memory attestationPayload,
        address /*attester*/,
        uint256 /*value*/
    ) internal view override {
        address subject = address(0);
        if (attestationPayload.subject.length == 32) {
            subject = abi.decode(attestationPayload.subject, (address));
        }
        if (attestationPayload.subject.length == 20) {
            subject = address(uint160(bytes20(attestationPayload.subject)));
        }
        if (subject != msg.sender) revert SenderIsNotSubject();

        // 解码验证数据
        (
            string memory nickname,
            string memory avatar,
            string memory socialAccount,
            bytes memory signature
        ) = abi.decode(
            attestationPayload.attestationData,
            (string, string, string, bytes)
        );

        // 验证签名
        bytes32 messageHash = keccak256(abi.encode(
            nickname,
            avatar,
            socialAccount
        ));

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        // 使用存储的签名者地址进行验证
        if (signer != signerAddress) {
            revert InvalidSignature();
        }
    }

    function withdraw(address payable /*to*/, uint256 /*amount*/) external override {}
}
