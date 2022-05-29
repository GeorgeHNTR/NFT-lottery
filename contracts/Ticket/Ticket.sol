//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import "../interfaces/ITicket.sol";

error InvalidInput();
error InvalidAmount();
error Paused();
error NotPausedYet();

contract Ticket is ITicket, ERC721URIStorageUpgradeable {
    uint64 public START;
    uint64 public END;
    uint128 public TICKET_PRICE;
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
        uint64 _start,
        uint64 _end,
        uint128 _price
    ) external override initializer {
        if (
            bytes(_name).length == 0 ||
            bytes(_symbol).length == 0 ||
            _price == 0 ||
            _start < block.number ||
            _end <= _start
        ) revert InvalidInput();

        __ERC721_init_unchained(_name, _symbol);

        START = _start;
        END = _end;
        TICKET_PRICE = _price;
    }

    function buyTicket() external payable override whenNotPaused {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        id++;
    }

    function buyTicketWithURI(string memory _tokenUri)
        external
        payable
        override
        whenNotPaused
    {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        _setTokenURI(id, _tokenUri);
        id++;
    }

    function paused() public view override returns (bool) {
        return block.number < START || block.number > END;
    }

    function finished() public view override returns (bool) {
        return block.number > END;
    }
}
