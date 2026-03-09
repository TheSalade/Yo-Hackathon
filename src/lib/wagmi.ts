import { http, createConfig, fallback } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  connectors: [injected()],
  transports: {
    [base.id]: fallback([
      http('https://base-rpc.publicnode.com'),
      http('https://base.llamarpc.com'),
      http('https://developer-access-mainnet.base.org'),
      http('https://base.blockpi.network/v1/rpc/public'),
      http(),
    ]),
    [mainnet.id]: fallback([
      http('https://ethereum-rpc.publicnode.com'),
      http('https://eth.llamarpc.com'),
      http('https://ethereum.blockpi.network/v1/rpc/public'),
      http(),
    ]),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
