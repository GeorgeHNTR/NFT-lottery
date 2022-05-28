//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";

error InvalidInput();

contract Ticket is ERC721PausableUpgradeable {
    function initialize(string memory name_, string memory symbol_)
        external
        initializer
    {
        if (bytes(name_).length == 0 || bytes(symbol_).length == 0)
            revert InvalidInput();

        __ERC721Pausable_init();
        __ERC721_init_unchained(name_, symbol_);
    }
}
