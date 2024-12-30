import { http, createConfig } from 'wagmi'
import { flowTestnet, opBNBTestnet, anvil } from 'wagmi/chains'
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

// 根据环境变量决定使用的链
const chains = process.env.NODE_ENV === 'development'
  ? [anvil, flowTestnet, opBNBTestnet] as const
  : [flowTestnet, opBNBTestnet] as const

// 配置钱包
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        trustWallet,
      ],
    },
  ],
  {
    appName: 'BountyBoard',
    projectId,
  }
)

// 配置 transport
const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http()])
) as Record<number, ReturnType<typeof http>>

export const config = createConfig({
  chains,
  transports,
  connectors,
})
