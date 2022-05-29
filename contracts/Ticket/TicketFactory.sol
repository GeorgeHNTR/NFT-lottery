//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./TicketBeacon.sol";
import "./TicketProxy.sol";
import "../interfaces/ITicket.sol";

error OnlyOneTicketAtTime();

contract TicketFactory is Ownable {
    address public immutable BEACON_ADDRESS;
    address public immutable VRF_CONSUMER;
    address[] _deployedTicketProxies;

    constructor(address _beaconAddress, address _vrfConsumerAddress) {
        BEACON_ADDRESS = _beaconAddress;
        VRF_CONSUMER = _vrfConsumerAddress;
    }

    function deployTicketProxy(
        string calldata _name,
        string calldata _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _ticketPrice
    ) external onlyOwner {
        address _latestTicketProxy = latestTicketProxy();
        if (
            _latestTicketProxy != address(0x0) &&
            !ITicket(_latestTicketProxy).finished()
        ) revert OnlyOneTicketAtTime();

        TicketProxy newTicketProxy = new TicketProxy(BEACON_ADDRESS);
        ITicket(address(newTicketProxy)).initialize(
            _name,
            _symbol,
            _start,
            _end,
            _ticketPrice,
            VRF_CONSUMER
        );
        _deployedTicketProxies.push(address(newTicketProxy));
    }

    function deployedTicketProxies() public view returns (address[] memory) {
        return _deployedTicketProxies;
    }

    function latestTicketProxy()
        public
        view
        returns (address _latestTicketProxy)
    {
        address[] memory deployedTicketProxies_ = _deployedTicketProxies;
        deployedTicketProxies_.length == 0
            ? _latestTicketProxy = address(0x0)
            : _latestTicketProxy = deployedTicketProxies_[
            deployedTicketProxies_.length - 1
        ];
    }
}
