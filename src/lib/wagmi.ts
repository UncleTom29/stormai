import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Sei Network configurations
export const seiMainnet = {
  id: 1329,
  name: 'Sei Network',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_SEI_MAINNET_RPC || 'https://evm-rpc.sei-apis.com'] },
  },
  blockExplorers: {
    default: { name: 'Seitrace', url: 'https://seitrace.com' },
  },
} as const;

export const seiTestnet = {
  id: 1328,
  name: 'Sei Testnet',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_SEI_TESTNET_RPC || 'https://evm-rpc-testnet.sei-apis.com'] },
  },
  blockExplorers: {
    default: { name: 'Seitrace', url: 'https://testnet.seitrace.com' },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [seiMainnet, seiTestnet, mainnet, sepolia],
  transports: {
    [seiMainnet.id]: http(),
    [seiTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}