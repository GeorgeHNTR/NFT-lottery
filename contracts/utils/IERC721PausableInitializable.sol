//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721PausableInitializable {
    /**
     * @dev Do not forget to add the "initializer" custom modifer
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 _start,
        uint256 _end
    ) external;
}
