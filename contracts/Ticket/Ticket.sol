//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";

import "../utils/IERC721PausableInitializable.sol";

error InvalidInput();

contract Ticket is IERC721PausableInitializable, ERC721PausableUpgradeable {
    uint256 public start;
    uint256 public end;
    uint256 public constant MINIMAL_DURATION = 2 hours;

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _start,
        uint256 _end
    ) external override initializer {
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0)
            revert InvalidInput();

        if (_start < block.timestamp || _end < _start + MINIMAL_DURATION)
            revert InvalidInput();

        __ERC721Pausable_init();
        __ERC721_init_unchained(_name, _symbol);

        start = _start;
        end = _end;
    }
}
