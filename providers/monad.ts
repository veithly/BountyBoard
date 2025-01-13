import { defineChain } from 'viem'

const monad = /*#__PURE__*/ defineChain({
  id: 20143,
  name: 'Monad Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DMON',
    symbol: 'DMON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a'],
    },
  },
})

export default monad;