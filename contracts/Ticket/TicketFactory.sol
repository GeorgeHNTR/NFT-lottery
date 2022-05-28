//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketBeacon.sol";
import "./TicketProxy.sol";
import "../utils/IERC721TimerInitializable.sol";

contract TicketFactory {
    address public immutable BEACON_ADDRESS;
    address[] _deployedTicketProxies;

    constructor(address _beaconAddress) {
        BEACON_ADDRESS = _beaconAddress;
    }

    function deployTicketProxy(
        string calldata _name,
        string calldata _symbol,
        uint256 _start,
        uint256 _end
    ) external {
        TicketProxy newTicketProxy = new TicketProxy(BEACON_ADDRESS);
        IERC721TimerInitializable(address(newTicketProxy)).initialize(
            _name,
            _symbol,
            _start,
            _end
        );
        _deployedTicketProxies.push(address(newTicketProxy));
    }

    function deployedTicketProxies() public view returns (address[] memory) {
        return _deployedTicketProxies;
    }
}
