//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketBeacon.sol";
import "./TicketProxy.sol";
import "../utils/IERC721TimerPricedInitializable.sol";

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
        uint256 _end,
        uint256 _ticketPrice
    ) external {
        TicketProxy newTicketProxy = new TicketProxy(BEACON_ADDRESS);
        IERC721TimerPricedInitializable(address(newTicketProxy)).initialize(
            _name,
            _symbol,
            _start,
            _end,
            _ticketPrice
        );
        _deployedTicketProxies.push(address(newTicketProxy));
    }

    function deployedTicketProxies() public view returns (address[] memory) {
        return _deployedTicketProxies;
    }
}
