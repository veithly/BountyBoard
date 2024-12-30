## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

## Deploy

### Script

```shell
forge script script/BountyBoard.s.sol:BountyBoardScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

forge script script/BountyBoard.s.sol:BountyBoardScript --rpc-url $RPC_URL_OPBNB --private-key $PRIVATE_KEY_OPBNB --broadcast --skip-simulation --legacy

forge script script/BountyBoard.s.sol:BountyBoardScript --rpc-url $RPC_URL_MANTLE --private-key $PRIVATE_KEY_MANTLE --broadcast --skip-simulation --legacy
```

Deploy UserProfile

```shell
forge script script/UserProfile.s.sol:UserProfileScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

forge script script/UserProfile.s.sol:UserProfileScript --rpc-url $RPC_URL_MANTLE --private-key $PRIVATE_KEY_MANTLE --broadcast
```

Deploy Mock ERC20

```shell
forge script script/DeployMockERC20.s.sol:DeployMockERC20Script --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

forge script script/DeployMockERC20.s.sol:DeployMockERC20Script --rpc-url $RPC_URL_MANTLE --private-key $PRIVATE_KEY_MANTLE --broadcast
```

### Create

BountyBoard

```shell
forge create --rpc-url $RPC_URL_OPBNB \
  --private-key $PRIVATE_KEY_OPBNB \
  src/BountyBoard.sol:BountyBoard

forge create --rpc-url $RPC_URL_LINEA \
  --private-key $PRIVATE_KEY_LINEA \
  src/BountyBoard.sol:BountyBoard

forge create --rpc-url $RPC_URL_MANTLE \
  --private-key $PRIVATE_KEY_MANTLE \
  src/BountyBoard.sol:BountyBoard
```

BountyBoard Proxy

```shell
cast calldata "initialize(address)" $SIGNER_ADDRESS

forge create --rpc-url $RPC_URL_OPBNB \
  --private-key $PRIVATE_KEY_OPBNB \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA

forge create --rpc-url $RPC_URL_MANTLE \
  --private-key $PRIVATE_KEY_MANTLE \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA

forge create --rpc-url $RPC_URL_LINEA \
  --private-key $PRIVATE_KEY_LINEA \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA
```

UserProfile

```shell
forge create --rpc-url $RPC_URL_OPBNB --private-key $PRIVATE_KEY_OPBNB src/UserProfile.sol:UserProfile --constructor-args $SIGNER_ADDRESS

forge create --rpc-url $RPC_URL_MANTLE --private-key $PRIVATE_KEY_MANTLE src/UserProfile.sol:UserProfile --constructor-args $SIGNER_ADDRESS

forge create --rpc-url $RPC_URL_LINEA --private-key $PRIVATE_KEY_LINEA src/UserProfile.sol:UserProfile --constructor-args $SIGNER_ADDRESS
```

Mock ERC20

```shell
forge create --rpc-url $RPC_URL_OPBNB --private-key $PRIVATE_KEY_OPBNB src/MockERC20.sol:MockERC20 --constructor-args "Bounty" "BOUNTY"

forge create --rpc-url $RPC_URL_MANTLE --private-key $PRIVATE_KEY_MANTLE src/MockERC20.sol:MockERC20 --constructor-args "Bounty" "BOUNTY"

forge create --rpc-url $RPC_URL_LINEA --private-key $PRIVATE_KEY_LINEA src/MockERC20.sol:MockERC20 --constructor-args "Bounty" "BOUNTY"
```

UserProfilePortal

```shell
forge create --rpc-url $RPC_URL_LINEA --private-key $PRIVATE_KEY_LINEA src/UserProfilePortal.sol:UserProfilePortal --constructor-args [] $VERAX_ROUTER_ADDRESS $SIGNER_ADDRESS
```

## Verify

BountyBoard

```shell
forge verify-contract \
  --verifier-url https://api-opbnb-testnet.bscscan.com/api \
  --etherscan-api-key $OPBNBSCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0x7F5c43e497d7F3392e7114809856Ac2fCc9454A6 \
  src/BountyBoard.sol:BountyBoard \
  --constructor-args $(cast abi-encode "constructor()") \
  --watch

forge verify-contract \
  --verifier-url https://api-opbnb-testnet.bscscan.com/api \
  --etherscan-api-key $OPBNBSCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0x397e12962a9dCed668FD5b7B2bfAfE585bdad323 \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" "0x7F5c43e497d7F3392e7114809856Ac2fCc9454A6" "0xc4d66de80000000000000000000000002809dca37069918607b1eaaf591de29fc389d3cc") \
  --watch

forge verify-contract \
  --verifier-url https://api-sepolia.mantlescan.xyz/api \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0x7F5c43e497d7F3392e7114809856Ac2fCc9454A6 \
  src/BountyBoard.sol:BountyBoard \
  --constructor-args $(cast abi-encode "constructor()") \
  --watch

forge verify-contract \
  --verifier-url https://api-sepolia.mantlescan.xyz/api \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0x397e12962a9dCed668FD5b7B2bfAfE585bdad323 \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" "0x7F5c43e497d7F3392e7114809856Ac2fCc9454A6" $(cast calldata "initialize(address)" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc")) \
  --watch

forge verify-contract \
  --watch \
  0x0d09f915E9C025366A14B78Bd78d1075e6aECB9b \
  src/BountyBoard.sol:BountyBoard \
  --constructor-args $(cast abi-encode "constructor()") \
  --etherscan-api-key $LINEASCAN_API_KEY \
  --verifier-url https://api-sepolia.lineascan.build/api
```

UserProfile

```shell
forge verify-contract \
  --verifier-url https://api-opbnb-testnet.bscscan.com/api \
  --etherscan-api-key $OPBNBSCAN_API_KEY \
  --compiler-version "v0.8.21" \
  0x698e8942d63cbFf3525fec8740A7EAaD6A251472 \
  src/UserProfile.sol:UserProfile \
  --constructor-args $(cast abi-encode "constructor(address)" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc") \
  --watch

forge verify-contract \
  --verifier-url https://api-sepolia.mantlescan.xyz/api \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  --compiler-version "v0.8.21" \
  0xCD40B2D99FBaf151f5C131A7ca3Cd801374Ec785 \
  src/UserProfile.sol:UserProfile \
  --constructor-args $(cast abi-encode "constructor(address)" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc") \
  --watch
```

UserProfilePortal

```shell
forge verify-contract \
  --constructor-args $(cast abi-encode "constructor(address[],address,address)" "[]" "0xAfA952790492DDeB474012cEA12ba34B788ab39F" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc") \
  0xEBEef006EE4001b653326A8bA07F4C8Ca8f372f1 \
  src/UserProfilePortal.sol:UserProfilePortal \
  --etherscan-api-key $LINEASCAN_API_KEY \
  --verifier-url https://api-sepolia.lineascan.build/api
```

Mock ERC20

```shell
forge verify-contract \
  --verifier-url https://api-opbnb-testnet.bscscan.com/api \
  --etherscan-api-key $OPBNBSCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0xE3945d3fE0f67962220f1f66069Cd9fea9E76659 \
  src/MockERC20.sol:MockERC20 \
  --constructor-args $(cast abi-encode "constructor(string,string)" "Bounty" "BOUNTY") \
  --watch

forge verify-contract \
  --verifier-url https://api-sepolia.mantlescan.xyz/api \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  --compiler-version "v0.8.27+commit.40a35a09" \
  0xaEbAfCa968c845bD69206Ba3c61cFbf59D123A23 \
  src/MockERC20.sol:MockERC20 \
  --constructor-args $(cast abi-encode "constructor(string,string)" "Bounty" "BOUNTY") \
  --watch
```

## Update

```shell
$ cast send --rpc-url https://linea-sepolia.infura.io/v3/f6f740dc92d444c89118838b7c1295b6 \
  --private-key $PRIVATE_KEY_LINEA \
  0xcDCeb52842Cc6dcCA264aC9C9AA8C1da1e6637D7 \ # proxy
  "upgradeToAndCall(address,bytes)" \
  0xBec6DF509D1e02172A8e3e756720cD1f4447456d \ # implementation
  0x
```

### Deploy to Flow Testnet

```shell
forge script script/BountyBoard.s.sol:BountyBoardScript --rpc-url https://testnet.evm.nodes.onflow.org --private-key $PRIVATE_KEY_FLOW --broadcast --legacy

forge script script/UserProfile.s.sol:UserProfileScript --rpc-url https://testnet.evm.nodes.onflow.org --private-key $PRIVATE_KEY_FLOW --broadcast --legacy

forge script script/DeployMockERC20.s.sol:DeployMockERC20Script --rpc-url https://testnet.evm.nodes.onflow.org --private-key $PRIVATE_KEY_FLOW --broadcast --legacy
```

### Create on Flow Testnet

BountyBoard:
```shell
forge create --rpc-url https://testnet.evm.nodes.onflow.org \
  --private-key $PRIVATE_KEY_FLOW \
  src/BountyBoard.sol:BountyBoard
```

BountyBoard Proxy:
```shell
cast calldata "initialize(address)" $SIGNER_ADDRESS

forge create --rpc-url https://testnet.evm.nodes.onflow.org \
  --private-key $PRIVATE_KEY_FLOW \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA
```

UserProfile:
```shell
forge create --rpc-url https://testnet.evm.nodes.onflow.org \
  --private-key $PRIVATE_KEY_FLOW \
  src/UserProfile.sol:UserProfile \
  --constructor-args $SIGNER_ADDRESS
```

Mock ERC20:
```shell
forge create --rpc-url https://testnet.evm.nodes.onflow.org \
  --private-key $PRIVATE_KEY_FLOW \
  src/MockERC20.sol:MockERC20 \
  --constructor-args "Bounty" "BOUNTY"
```

### Verify on Flow Testnet

BountyBoard:
```shell
forge verify-contract \
  --verifier-url https://evm-testnet.flowscan.io/api \
  0xf72eD6a6BC53669B7E818A106Ec9E7B090D3Da86 \
  src/BountyBoard.sol:BountyBoard \
  --constructor-args $(cast abi-encode "constructor()")
```

BountyBoard Proxy:
```shell
forge verify-contract \
  --verifier-url https://evm-testnet.flowscan.io/api \
  0x09D61437f07838AB892Bd92386EC39462BfE1972 \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" "0xf72eD6a6BC53669B7E818A106Ec9E7B090D3Da86" $(cast calldata "initialize(address)" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc"))
```

UserProfile:
```shell
forge verify-contract \
  --verifier-url https://evm-testnet.flowscan.io/api \
  0xBec6DF509D1e02172A8e3e756720cD1f4447456d \
  src/UserProfile.sol:UserProfile \
  --constructor-args $(cast abi-encode "constructor(address)" $SIGNER_ADDRESS)
```

Mock ERC20:
```shell
forge verify-contract \
  --verifier-url https://evm-testnet.flowscan.io/api \
  0xf576133fB9B5ac7186Dd917C915d90aFFD396c11 \
  src/MockERC20.sol:MockERC20 \
  --constructor-args $(cast abi-encode "constructor(string,string)" "Bounty" "BOUNTY")
```
