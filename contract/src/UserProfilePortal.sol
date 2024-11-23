// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AbstractPortal} from "../lib/linea-attestation-registry/contracts/src/abstracts/AbstractPortal.sol";
import {AttestationPayload} from "../lib/linea-attestation-registry/contracts/src/types/Structs.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract UserProfilePortal is AbstractPortal, Ownable, EIP712 {
    address public signerAddress;
    string private constant SIGNING_DOMAIN = "UserProfile";
    string private constant SIGNATURE_VERSION = "1";

    error InvalidSubject();
    error SenderIsNotSubject();
    error InvalidSignature();
    error InvalidSignatureLength();
    error NotImplemented();

    constructor(
        address[] memory modules,
        address router,
        address _signerAddress
    ) AbstractPortal(modules, router) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) Ownable(msg.sender) {
        signerAddress = _signerAddress;
    }

    function setSignerAddress(address _newSignerAddress) external onlyOwner {
        require(_newSignerAddress != address(0), "Invalid signer address");
        signerAddress = _newSignerAddress;
    }

    function _onAttestV2(
        AttestationPayload memory attestationPayload,
        bytes[] memory validationPayloads,
        uint256 /*value*/
    ) internal view override {
        // 验证 subject 是否为有效地址
        if (attestationPayload.subject.length != 20) revert InvalidSubject();
        address subject = address(uint160(bytes20(attestationPayload.subject)));

        // 验证发送者是否为 subject
        if (msg.sender != subject) revert SenderIsNotSubject();

        // 解码认证数据
        (
            string memory nickname,
            string memory avatar,
            string memory socialAccount
        ) = abi.decode(
            attestationPayload.attestationData,
            (string, string, string)
        );

        // 验证签名
        if (!verifySignature(
            validationPayloads[0],
            nickname,
            avatar,
            socialAccount,
            subject
        )) revert InvalidSignature();
    }

    function _onAttest(
        AttestationPayload memory /*attestationPayload*/,
        address /*attester*/,
        uint256 /*value*/
    ) internal pure override {
        revert NotImplemented();
    }

    function verifySignature(
        bytes memory signature,
        string memory nickname,
        string memory avatar,
        string memory socialAccount,
        address subject
    ) internal view returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("UserProfile(string nickname,string avatar,string socialAccount,address subject)"),
                    keccak256(bytes(nickname)),
                    keccak256(bytes(avatar)),
                    keccak256(bytes(socialAccount)),
                    subject
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        return signer == signerAddress;
    }

    function withdraw(address payable to, uint256 amount) external override onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function _onReplace(
        bytes32 /*attestationId*/,
        AttestationPayload memory /*attestationPayload*/,
        address /*attester*/,
        uint256 /*value*/
    ) internal view override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }

    function _onBulkReplace(
        bytes32[] memory /*attestationIds*/,
        AttestationPayload[] memory /*attestationsPayloads*/,
        bytes[][] memory /*validationPayloads*/
    ) internal view override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }

    function _onBulkAttest(
        AttestationPayload[] memory /*attestationsPayloads*/,
        bytes[][] memory /*validationPayloads*/
    ) internal pure override {
        revert NotImplemented();
    }

    function _onRevoke(bytes32 /*attestationId*/) internal view override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }

    function _onBulkRevoke(bytes32[] memory /*attestationIds*/) internal view override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }
}