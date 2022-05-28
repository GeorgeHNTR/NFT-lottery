//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721TimerPricedInitializable {
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
}
