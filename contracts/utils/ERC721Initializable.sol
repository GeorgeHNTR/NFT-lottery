//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC721Initializable {
    /**
     * @dev Do not forget to add the "initializer" custom modifer
     */
    function initialize(string memory name_, string memory symbol_) external;
}
