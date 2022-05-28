//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";

import "../utils/IERC721PausableInitializable.sol";

error InvalidInput();
error InvalidAmount();

contract Ticket is IERC721PausableInitializable, ERC721PausableUpgradeable {
    uint256 public start;
    uint256 public end;

    uint16 public constant MINIMAL_DURATION = 2 hours;
    uint64 public constant TICKET_PRICE = 0.001 ether;

    uint256 public id = 0;

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _start,
        uint256 _end
    ) external override initializer {
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0)
            revert InvalidInput();

        if (_start < block.timestamp || _end < _start + MINIMAL_DURATION)
            revert InvalidInput();

        __ERC721Pausable_init();
        __ERC721_init_unchained(_name, _symbol);

        start = _start;
        end = _end;
    }

    function buyTicket() external payable whenNotPaused {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        id++;
    }
}
