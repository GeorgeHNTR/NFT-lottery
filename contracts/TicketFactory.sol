//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketBeacon.sol";
import "./TicketProxy.sol";

contract TicketFactory {
    address public immutable BEACON_ADDRESS;
    address[] _deployedTicketProxies;

    constructor(address _beaconAddress) {
        BEACON_ADDRESS = _beaconAddress;
    }

    function deployTicketProxy(string memory _name, string memory _symbol)
        external
    {
        TicketProxy newTicketProxy = new TicketProxy(BEACON_ADDRESS);
        ERC721Initializable(address(newTicketProxy)).initialize(_name, _symbol);
        _deployedTicketProxies.push(address(newTicketProxy));
    }

    function deployedTicketProxies() public view returns (address[] memory) {
        return _deployedTicketProxies;
    }
}
