import { http, createConfig } from 'wagmi'
import { aiaTestnet } from './aiachain'

// 更新配置
export const config = createConfig({
  chains: [aiaTestnet],
  transports: {
    [aiaTestnet.id]: http(),
  },
})
