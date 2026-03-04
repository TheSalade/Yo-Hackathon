import { http, createConfig } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
