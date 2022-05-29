//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import "../interfaces/ITicket.sol";
import "../WinnerPicker.sol";

error InvalidInput();
error InvalidAmount();
error NotStartedYet();
error NotFinishedYet();
error AlreadyFinished();
error Unauthorized();
error TransactionFailed();

contract Ticket is ITicket, ERC721URIStorageUpgradeable {
    WinnerPicker WINNER_PICKER;
    uint64 public START;
    uint64 public END;
    uint128 public TICKET_PRICE;
    uint128 public id = 0;
    address public winner;

    modifier afterStart() {
        if (!started()) revert NotStartedYet();
        _;
    }

    modifier beforeEnd() {
        if (finished()) revert AlreadyFinished();
        _;
    }

    modifier afterEnd() {
        if (!finished()) revert NotFinishedYet();
        _;
    }

    function initialize(
        string calldata _name,
        string calldata _symbol,
        uint64 _start,
        uint64 _end,
        uint128 _price,
        address _winnerPicker
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
        WINNER_PICKER = WinnerPicker(_winnerPicker);
    }

    function buyTicket() external payable override afterStart beforeEnd {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        id++;
    }

    function buyTicketWithURI(string memory _tokenUri)
        external
        payable
        override
        afterStart
        beforeEnd
    {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _mint(msg.sender, id);
        _setTokenURI(id, _tokenUri);
        id++;
    }

    function pickWinner() external afterEnd {
        WINNER_PICKER.getRandomNumber("saveWinner(uint256)");
    }

    function saveWinner(uint256 _randomness) external afterEnd {
        if (msg.sender != address(WINNER_PICKER)) revert Unauthorized();
        uint256 winningTokenId = _randomness % id;
        winner = ownerOf(winningTokenId);
    }

    function claimReward() external afterEnd {
        if (msg.sender != winner) revert Unauthorized();

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert TransactionFailed();
    }

    function started() public view override returns (bool) {
        return block.number >= START;
    }

    function finished() public view override returns (bool) {
        return block.number > END;
    }
}
