import { http, createConfig } from 'wagmi'
import { holesky } from 'wagmi/chains'

export const config = createConfig({
  chains: [holesky],
  transports: {
    [holesky.id]: http(),
  },
})
