//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

error InsufficientBalance();

contract WinnerPicker is VRFConsumerBase {
    bytes32 internal _keyHash;
    uint256 internal _fee;

    /// @notice requst id to contract address that made the request
    mapping(bytes32 => address) internal requests;

    /// @notice requst id to bytes4(keccak256("<-callback_signature->"))
    /// @dev fuction must have uint256 parameter representing the random number
    mapping(bytes32 => string) internal callbacks;

    constructor(
        address vrfCoordinator_,
        address link_,
        bytes32 keyHash_
    ) VRFConsumerBase(vrfCoordinator_, link_) {
        _keyHash = keyHash_;
        _fee = 0.1 * 10**18; // 0.1 LINK
    }

    function getRandomNumber(string memory callbackSignature)
        public
        returns (bytes32 requestId)
    {
        if (LINK.balanceOf(address(this)) < _fee) revert InsufficientBalance();
        requestId = requestRandomness(_keyHash, _fee);
        requests[requestId] = msg.sender;
        callbacks[requestId] = callbackSignature;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        (bool success, ) = requests[requestId].call(
            abi.encodeWithSignature(callbacks[requestId], randomness)
        );
        if (!success) revert();
    }
}
