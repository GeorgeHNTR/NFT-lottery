//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Ticket/Ticket.sol";
import "./Ticket/TicketBeacon.sol";
import "./Ticket/TicketFactory.sol";
import "./WinnerPicker.sol";

contract LotteryManager is Ownable {
    TicketBeacon public ticketBeacon;
    TicketFactory public ticketFactory;

    function setupLottery(address implementation_, address winnerPicker_)
        external
        onlyOwner
    {
        ticketBeacon = new TicketBeacon(implementation_);
        ticketFactory = new TicketFactory(address(ticketBeacon), winnerPicker_);
    }

    function transferLotteryOwnership(address newOwner) external onlyOwner {
        ticketBeacon.transferOwnership(newOwner);
        ticketFactory.transferOwnership(newOwner);
    }

    function changeImplementation(address newImplementation)
        external
        onlyOwner
    {
        ticketBeacon.upgradeTo(newImplementation);
    }

    function deployTicketProxy(
        string calldata _name,
        string calldata _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _ticketPrice
    ) external onlyOwner {
        ticketFactory.deployTicketProxy(
            _name,
            _symbol,
            _start,
            _end,
            _ticketPrice
        );
    }

    function deployTicketProxyDeterministic(
        string calldata _name,
        string calldata _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _ticketPrice,
        uint128 _salt
    ) external onlyOwner {
        ticketFactory.deployTicketProxyDeterministic(
            _name,
            _symbol,
            _start,
            _end,
            _ticketPrice,
            _salt
        );
    }
}
