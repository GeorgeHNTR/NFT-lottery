//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITicket {
    /**
     * @dev Do not forget to add the "initializer" custom modifer
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint256 _start,
        uint256 _end,
        uint256 _price
    ) external;

    function buyTicket() external payable;

    function buyTicketWithURI(string memory _tokenUri) external payable;

    function paused() external view returns (bool);

    function finished() external view returns (bool);
}
