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

```shell
forge create --rpc-url $RPC_URL_LINEA --private-key $PRIVATE_KEY_LINEA src/UserProfilePortal.sol:UserProfilePortal --constructor-args [] $VERAX_ROUTER_ADDRESS $SIGNER_ADDRESS
```

## Verify

```shell
forge verify-contract \
--constructor-args $(cast abi-encode "constructor(address[],address,address)" "[]" "0xAfA952790492DDeB474012cEA12ba34B788ab39F" "0x2809dCa37069918607b1eAaf591dE29fC389D3Cc") \0xEBEef006EE4001b653326A8bA07F4C8Ca8f372f1 \
src/UserProfilePortal.sol:UserProfilePortal \
--etherscan-api-key $LINEASCAN_API_KEY \
--verifier-url https://api-sepolia.lineascan.build/api
```

