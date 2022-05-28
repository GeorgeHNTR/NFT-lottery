//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "../utils/ERC721Initializable.sol";

contract TicketProxy is BeaconProxy {
    constructor(address _beacon) payable BeaconProxy(_beacon, "") {}

    function beacon() public view returns (address) {
        return _beacon();
    }

    function implementation() public view returns (address) {
        return _implementation();
    }
}
