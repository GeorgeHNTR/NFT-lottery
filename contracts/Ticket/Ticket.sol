//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import "../utils/IERC721TimerPricedInitializable.sol";

error InvalidInput();
error InvalidAmount();
error Paused();
error NotPausedYet();

contract Ticket is IERC721TimerPricedInitializable, ERC721Upgradeable {
    uint256 public START;
    uint256 public END;
    uint256 public TICKET_PRICE;
    
    uint16 public constant MINIMAL_DURATION = 2 hours;
    uint128 public id = 0;

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
        uint256 _end,
        uint256 _price
    ) external override initializer {
        if (
            bytes(_name).length == 0 ||
            bytes(_symbol).length == 0 ||
            _price == 0
        ) revert InvalidInput();

        if (_start < block.timestamp) _start = block.timestamp; // start immediately
        uint256 duration = _end - _start;

        if (duration < MINIMAL_DURATION) revert InvalidInput();

        __ERC721_init_unchained(_name, _symbol);

        START = _start;
        END = _end;
        TICKET_PRICE = _price;
    }

    function buyTicket() external payable whenNotPaused {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        id++;
    }

    function paused() public view returns (bool) {
        return block.timestamp < START || block.timestamp > END;
    }
}
