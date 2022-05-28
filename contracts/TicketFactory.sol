//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketBeacon.sol";
import "./TicketProxy.sol";

contract TicketFactory {
    address immutable BEACON_ADDRESS;
    address[] _deployedTicketProxies;

    constructor(address _beaconAddress) {
        BEACON_ADDRESS = _beaconAddress;
    }

    function deployTicketProxy() external {
        address newTicketProxy = address(new TicketProxy(BEACON_ADDRESS, ""));
        _deployedTicketProxies.push(newTicketProxy);
    }

    function deployedTicketProxies() public view returns (address[] memory) {
        return _deployedTicketProxies;
    }
}
