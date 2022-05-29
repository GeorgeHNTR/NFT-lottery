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

/// @author Georgi Nikolaev Georgiev
/// @notice Upgradeable ERC721 lottery contract
/// @notice Allows minting tickets for a certain period of time then chooses a winner
/// @dev Used as an implementation to a proxy contract
/// @dev Uses initializing function instead of constructor
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

    /// @notice The initializer function of this proxied contracts (acts as a constructor)
    /// @param _name Name of this ERC721
    /// @param _symbol Symbol of this ERC721
    /// @param _start Minting tickets opens from this block number
    /// @param _end Minting tickets is not allowed after this block number
    /// @param _price Constant price of each single ticket
    /// @param _winnerPicker VRFConsumer contract address used to help select a winning token id
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

    /// @notice Allows users to purchase tickets ones the sale has begun and has not yet finished
    function buyTicket() external payable override afterStart beforeEnd {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _purchaseTicket("");
    }

    /// @notice Allows users to purchase tickets using token uri
    /// @param _tokenUri The uri of the user's ticket pointing to an off-chain source of data
    function buyTicketWithURI(string calldata _tokenUri)
        external
        payable
        override
        afterStart
        beforeEnd
    {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _purchaseTicket(_tokenUri);
    }

    /// @notice Purchases ticket for a user with an optional token uri
    /// @param _tokenUri The uri of the user's ticket pointing to an off-chain source of data
    function _purchaseTicket(string memory _tokenUri) private {
        _mint(msg.sender, id);
        if (bytes(_tokenUri).length != 0) _setTokenURI(id, _tokenUri);
        id++;
    }

    /// @notice In order to later execute the pickWinner() function this contract needs a LINK balance
    /// @notice The first user who funds this contract with LINK will receive 3 free tickets as a compensation
    /// @dev The user has to approve LINK token transfer for an amount of WINNER_PICKER.fee() before executing this function
    function _fundVrfConsumer() private {
        LinkTokenInterface LINK = WINNER_PICKER.LINK_TOKEN();
        uint256 fee = WINNER_PICKER.fee();

        // if we already have the needed LINK balance
        if (LINK.balanceOf(address(this)) >= fee) return;

        bool success = LINK.transferFrom(msg.sender, address(this), fee);
        if (!success) revert TransactionFailed();

        // mint 3 tickets to compensate msg.sender for the LINK tokens
        for (uint8 i = 0; i < 3; i++) _purchaseTicket("");
    }

    /// @notice Sends request to the vrf consumer to generate a random number for later use
    /// @dev Does not directly pick the winner, instead passes the signature of the callback function
    /// @dev that has to be invoked ones the random number is ready
    function pickWinner() external override afterEnd {
        _fundVrfConsumer();
        WINNER_PICKER.LINK_TOKEN().transferFrom(
            address(this),
            address(WINNER_PICKER),
            WINNER_PICKER.fee()
        );
        WINNER_PICKER.getRandomNumber("saveWinner(uint256)");
    }

    /// @notice Selects the winning ticket and saves its owner as a lottery winner
    /// @param _randomness Random number passed by the winner_picker contract
    /// @dev Winning ticket id is calculated using modulo division
    /// @dev Reverts if called from any contract that is not the winner picker
    function saveWinner(uint256 _randomness) external override afterEnd {
        if (msg.sender != address(WINNER_PICKER)) revert Unauthorized();
        uint256 winningTokenId = _randomness % id;
        winner = ownerOf(winningTokenId);
    }

    /// @notice Transfers all gathered funds from the lottery to the winner address
    /// @dev Pull over Push pattern
    function claimReward() external override afterEnd {
        if (msg.sender != winner) revert Unauthorized();

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert TransactionFailed();
    }

    /// @notice Tracks whether the sale has started
    /// @return bool A boolean showing whether the sale has started
    function started() public view override returns (bool) {
        return block.number >= START;
    }

    /// @notice Tracks whether the sale has finished
    /// @return bool A boolean showing whether the sale has finished
    function finished() public view override returns (bool) {
        return block.number > END;
    }
}
