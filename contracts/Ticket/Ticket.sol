//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import "../interfaces/ITicket.sol";
import "../WinnerPicker.sol";

error InvalidInput();
error InvalidAmount();
error Unavailable();
error Unauthorized();
error TransactionFailed();
error WinnerAlreadyChosen();

/// @author Georgi Nikolaev Georgiev
/// @notice Upgradeable ERC721 lottery contract
/// @notice Allows minting tickets for a certain period of time then chooses a winner
/// @dev Used as an implementation to a proxy contract
/// @dev Uses initializing function instead of constructor
contract Ticket is ITicket, ERC721URIStorageUpgradeable {
    WinnerPicker public WINNER_PICKER;

    uint64 public START_BLOCK_NUMBER;
    uint64 public END_BLOCK_NUMBER;

    uint128 public TICKET_PRICE;
    uint128 public id = 0;

    uint256 public bigWinnerTicketId;

    uint256 public smallWinnerTicketId;
    uint256 public smallWinnerRewardAmount;

    bool pickedSmall;
    bool pickedBig;
    bool payedSmall;

    event WinnerChoosen(address indexed winner, uint256 indexed ticket);

    modifier fromBlock(uint64 blockNumber) {
        if (block.number < blockNumber) revert Unavailable();
        _;
    }

    modifier toBlock(uint64 blockNumber) {
        if (block.number > blockNumber) revert Unavailable();
        _;
    }

    modifier onlyWinnerPicker() {
        if (msg.sender == address(WINNER_PICKER)) revert Unauthorized();
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

        START_BLOCK_NUMBER = _start;
        END_BLOCK_NUMBER = _end;
        TICKET_PRICE = _price;
        WINNER_PICKER = WinnerPicker(_winnerPicker);
    }

    /// @notice Allows users to purchase tickets ones the sale has begun and has not yet finished
    function buyTicket()
        external
        payable
        override
        fromBlock(START_BLOCK_NUMBER)
        toBlock(END_BLOCK_NUMBER)
    {
        if (msg.value != TICKET_PRICE) revert InvalidAmount();
        _purchaseTicket("");
    }

    /// @notice Allows users to purchase tickets using token uri
    /// @param _tokenUri The uri of the user's ticket pointing to an off-chain source of data
    function buyTicketWithURI(string calldata _tokenUri)
        external
        payable
        override
        fromBlock(START_BLOCK_NUMBER)
        toBlock(END_BLOCK_NUMBER)
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

    /// @notice Sends request to the vrf consumer to generate a random number for later use
    /// @dev Does not directly pick the winner, instead passes the signature of the callback function
    /// @dev that has to be invoked ones the random number is ready
    function pickWinner()
        external
        override
        fromBlock((START_BLOCK_NUMBER + END_BLOCK_NUMBER) / 2)
    {
        if (
            (block.number < END_BLOCK_NUMBER && pickedSmall) ||
            (block.number >= END_BLOCK_NUMBER && pickedBig)
        ) revert WinnerAlreadyChosen();

        _fundVrfConsumer();

        if (block.number < END_BLOCK_NUMBER) {
            WINNER_PICKER.getRandomNumber("saveSmallWinner(uint256)");
            pickedSmall = true;
        } else {
            WINNER_PICKER.getRandomNumber("saveBigWinner(uint256)");
            pickedBig = true;
        }
    }

    /// @notice In order to later execute the pickWinner() function this contract needs a LINK balance
    /// @dev The user has to approve LINK token transfer for an amount of WINNER_PICKER.fee() before executing this function
    function _fundVrfConsumer() private {
        LinkTokenInterface LINK = WINNER_PICKER.LINK_TOKEN();
        uint256 fee = WINNER_PICKER.fee();

        bool success = LINK.transferFrom(
            msg.sender,
            address(WINNER_PICKER),
            fee
        );
        if (!success) revert TransactionFailed();
    }

    /// @notice Selects the winning ticket and saves it as the lottery's small winner
    /// @notice Small winner will receive half (50%) of the current lottery's gathered funds
    /// @param _randomness Random number passed by the winner_picker contract
    /// @dev Winning ticket id is calculated using modulo division
    /// @dev Reverts if called from any contract that is not the winner picker
    function saveSmallWinner(uint256 _randomness)
        external
        override
        onlyWinnerPicker
    {
        uint256 winningTokenId = _randomness % id;
        smallWinnerTicketId = winningTokenId;
        smallWinnerRewardAmount = address(this).balance / 2;
        emit WinnerChoosen(ownerOf(winningTokenId), winningTokenId);
    }

    /// @notice Selects the winning ticket and saves it as the lottery's big winner
    /// @param _randomness Random number passed by the winner_picker contract
    /// @dev Winning ticket id is calculated using modulo division
    /// @dev Reverts if called from any contract that is not the winner picker
    function saveBigWinner(uint256 _randomness)
        external
        override
        onlyWinnerPicker
    {
        uint256 winningTokenId = _randomness % id;
        bigWinnerTicketId = winningTokenId;
        emit WinnerChoosen(ownerOf(winningTokenId), winningTokenId);
    }

    /// @notice Transfers all gathered funds from the lottery to winner
    /// @dev Pull over Push pattern
    function claimSmallReward() external override fromBlock(END_BLOCK_NUMBER) {
        address winner = ownerOf(smallWinnerTicketId);

        if (msg.sender != winner) revert Unauthorized();
        if (payedSmall) revert();

        (bool success, ) = msg.sender.call{value: smallWinnerRewardAmount}("");
        if (!success) revert TransactionFailed();
        payedSmall = true;
    }

    /// @notice Transfers all gathered funds left from the lottery to the big winner
    /// @dev Pull over Push pattern
    function claimBigReward() external override fromBlock(END_BLOCK_NUMBER) {
        address winner = ownerOf(bigWinnerTicketId);

        if (msg.sender != winner) revert Unauthorized();

        uint256 rewardAmount;
        if (payedSmall) {
            rewardAmount = address(this).balance;
        } else if (!payedSmall)
            rewardAmount = address(this).balance - smallWinnerRewardAmount;

        (bool success, ) = msg.sender.call{value: rewardAmount}("");
        if (!success) revert TransactionFailed();
    }

    /// @notice Tracks whether the sale has started
    /// @return bool A boolean showing whether the sale has started
    function started() public view override returns (bool) {
        return block.number >= START_BLOCK_NUMBER;
    }

    /// @notice Tracks whether the sale has finished
    /// @return bool A boolean showing whether the sale has finished
    function finished() public view override returns (bool) {
        return block.number > END_BLOCK_NUMBER;
    }
}
