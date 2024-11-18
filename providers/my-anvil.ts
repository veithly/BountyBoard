import { defineChain } from 'viem'

const anvil = /*#__PURE__*/ defineChain({
  id: 31_337,
  name: 'Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://sg.shineteens.com:8545'],
      webSocket: ['ws://sg.shineteens.com:8545'],
    },
  },
})

export default anvil;