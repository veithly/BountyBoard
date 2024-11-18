import { http, createConfig } from 'wagmi'
import { lineaSepolia } from 'wagmi/chains'
import anvil from './my-anvil'

// 更新配置
export const config = createConfig({
  chains: [anvil, lineaSepolia],
  transports: {
    [anvil.id]: http(),
    [lineaSepolia.id]: http(),
  },
})
