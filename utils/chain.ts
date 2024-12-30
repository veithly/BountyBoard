import { Chain } from 'viem';

export const getNativeTokenSymbol = (chain?: Chain): string => {
  if (!chain) return 'ETH';

  switch (chain.id) {
    case 1: // Ethereum Mainnet
      return 'ETH';
    case 137: // Polygon
      return 'MATIC';
    case 5611: // BSC
      return 'BNB';
    case 97: // BSC Testnet
      return 'BNB';
    case 204: // OPBNB Testnet
      return 'BNB';
    case 42161: // Arbitrum
      return 'ETH';
    case 10: // Optimism
      return 'ETH';
    case 545: // Flow
      return 'FLOW';
    case 43114: // Avalanche
      return 'AVAX';
    case 59140: // Linea Testnet
      return 'ETH';
    case 5003: // Mantle Testnet
      return 'MNT';
    case 5000: // Mantle Mainnet
      return 'MNT';
    default:
      return 'ETH';
  }
};