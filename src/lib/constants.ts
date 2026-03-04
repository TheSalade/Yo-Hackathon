import type { VaultId } from '@yo-protocol/core';

// Vault APY/description data (supplementing on-chain data)
export const VAULT_META: Record<VaultId, {
    apy: number;
    description: string;
    color: string;
    emoji: string;
    underlyingSymbol: string;
}> = {
    yoUSD: {
        apy: 4.2,
        description: 'USDC yield vault on Base',
        color: '#d4f500',
        emoji: '💵',
        underlyingSymbol: 'USDC',
    },
    yoBTC: {
        apy: 2.9,
        description: 'cbBTC yield vault on Base',
        color: '#f7931a',
        emoji: '₿',
        underlyingSymbol: 'cbBTC',
    },
    yoEUR: {
        apy: 3.1,
        description: 'EURC yield vault on Base',
        color: '#0052b4',
        emoji: '€',
        underlyingSymbol: 'EURC',
    },
    yoETH: {
        apy: 3.8,
        description: 'WETH yield vault on Ethereum',
        color: '#627eea',
        emoji: 'Ξ',
        underlyingSymbol: 'ETH',
    },
    yoGOLD: {
        apy: 5.1,
        description: 'Gold-backed yield vault on Ethereum',
        color: '#ffd700',
        emoji: '🥇',
        underlyingSymbol: 'XAUt',
    },
    yoUSDT: {
        apy: 4.5,
        description: 'USDT yield vault on Ethereum',
        color: '#26a17b',
        emoji: '💰',
        underlyingSymbol: 'USDT',
    },
};

// Vaults shown on landing ticker
export const TICKER_VAULTS: { id: VaultId; chain: string }[] = [
    { id: 'yoUSD', chain: 'Base' },
    { id: 'yoETH', chain: 'Ethereum' },
    { id: 'yoBTC', chain: 'Base' },
    { id: 'yoEUR', chain: 'Base' },
    { id: 'yoGOLD', chain: 'Ethereum' },
    { id: 'yoUSDT', chain: 'Ethereum' },
];

// Vaults shown in the app dashboard (Base-first priority)
export const APP_VAULTS: VaultId[] = ['yoUSD', 'yoBTC', 'yoEUR', 'yoETH'];
