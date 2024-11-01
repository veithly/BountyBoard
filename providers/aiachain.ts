import { defineChain } from 'viem'

export const aiaTestnet = defineChain({
  id: 1320,
  name: 'AIA Testnet',
  network: 'aia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'AIA',
    symbol: 'AIA',
  },
  rpcUrls: {
    default: {
      http: ['https://aia-dataseed1-testnet.aiachain.org'],
    },
    public: {
      http: ['https://aia-dataseed1-testnet.aiachain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'AIA Explorer',
      url: 'https://testnet.aiascan.com',
    },
  },
  testnet: true,
})