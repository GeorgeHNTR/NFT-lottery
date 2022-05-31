# NFT Lottery
## Nexo Assignment
- NFT Lottery project
- Hardhat based
- Lottery tickets should be upgradeable

## Contracts
### Ticket (Lottery)
- An **ERC721URIStorageUpgradeable** contract
- Supports minting tickets from a certain block onwards for a certain period of time
- A user has to fund the Chainlink VRF Consumer with **LINK** tokens and then be rewarded with 3 free tickets
- At the end a winner is chosen using **Chainlink VRF**
### TicketProxy
- Simple **beacon proxy** using the Ticket contract as its implementation
### TicketBeacon
- Simple **beacon** managing the implementation used by the TicketProxy
### TicketFactory
- Ownable factory contract for deploying ticket proxies
- Supports determministic deployment using the **create2** opcode
- Restricted access for deployment to only owner
### WinnerPicker
- VRF Consumer using chainlink vrf setup for mainnet or rinkeby
- Creates requests for generating new number
- Saves **msg.sender** and **its callback function *signature*** used later to pass the received random number from chainlink

---
**NOTE: OWNERSHIP**

**TicketBeacon**, **TicketFactory** and **WinnerPicker** contracts share the same owner

---

### Run & test
- `git clone https://github.com/GeorgiGeorgiev7/NFT-lottery`
- `yarn`
- `npm run test` or `npx hardhat test`

### Documentation
https://lottery-docgen.web.app
