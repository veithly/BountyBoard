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
$ forge script script/BountyBoard.s.sol:BountyBoardScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Deploy Mock ERC20

```shell
$ forge script script/DeployMockERC20.s.sol:DeployMockERC20Script --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### Create

BountyBoard

```shell
$ forge create --rpc-url $RPC_URL_LINEA \
  --private-key $PRIVATE_KEY_LINEA \
  src/BountyBoard.sol:BountyBoard
```

BountyBoard Proxy

```shell
$ cast abi-encode "initialize(address)" $SIGNER_ADDRESS

$ forge create --rpc-url $RPC_URL_LINEA \
  --private-key $PRIVATE_KEY_LINEA \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA
```

UserProfilePortal

```shell
forge create --rpc-url $RPC_URL_LINEA --private-key $PRIVATE_KEY_LINEA src/UserProfilePortal.sol:UserProfilePortal --constructor-args [] $VERAX_ROUTER_ADDRESS $SIGNER_ADDRESS
```

## Verify

BountyBoard

```shell
forge verify-contract \
  --watch \
  0x0d09f915E9C025366A14B78Bd78d1075e6aECB9b \
  src/BountyBoard.sol:BountyBoard \
  --constructor-args $(cast abi-encode "constructor()") \
  --etherscan-api-key $LINEASCAN_API_KEY \
  --verifier-url https://api-sepolia.lineascan.build/api
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

## Update

```shell
$ cast send --rpc-url https://linea-sepolia.infura.io/v3/f6f740dc92d444c89118838b7c1295b6 \
  --private-key $PRIVATE_KEY_LINEA \
  0xcDCeb52842Cc6dcCA264aC9C9AA8C1da1e6637D7 \ # proxy
  "upgradeToAndCall(address,bytes)" \
  0xBec6DF509D1e02172A8e3e756720cD1f4447456d \ # implementation
  0x
```
