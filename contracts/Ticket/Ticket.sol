//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import "../utils/IERC721TimerInitializable.sol";

error InvalidInput();
error InvalidAmount();
error Paused();
error NotPausedYet();

contract Ticket is IERC721TimerInitializable, ERC721Upgradeable {
    uint16 public constant MINIMAL_DURATION = 2 hours;
    uint64 public constant TICKET_PRICE = 0.001 ether;

    uint256 public start;
    uint256 public end;

    uint256 public id = 0;

    modifier whenNotPaused() {
        if (paused()) revert Paused();
        _;
    }

    modifier whenPaused() {
        if (!paused()) revert NotPausedYet();
        _;
    }

    function initialize(
        string calldata _name,
        string calldata _symbol,
        uint256 _start,
        uint256 _end
    ) external override initializer {
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0)
            revert InvalidInput();

        if (_start < block.timestamp) _start = block.timestamp; // start immediately
        uint256 duration = _end - _start;

        if (duration < MINIMAL_DURATION)
            revert InvalidInput();

        __ERC721_init_unchained(_name, _symbol);

        start = _start;
        end = _end;
    }

    function buyTicket() external payable whenNotPaused {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        id++;
    }

    function paused() public view returns (bool) {
        return block.timestamp < start || block.timestamp > end;
    }
}
