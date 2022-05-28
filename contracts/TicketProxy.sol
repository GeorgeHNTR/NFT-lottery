//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract TicketProxy is BeaconProxy {
    constructor(address beacon, bytes memory data)
        payable
        BeaconProxy(beacon, data)
    {}
}
