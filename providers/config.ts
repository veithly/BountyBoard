import { http, createConfig } from 'wagmi'
import { lineaSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [lineaSepolia],
  transports: {
    [lineaSepolia.id]: http(),
  },
})
