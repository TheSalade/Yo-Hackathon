import { useReadContracts, useAccount, useChainId } from 'wagmi';
import { useEffect } from 'react';
import { APP_VAULTS } from '@/lib/constants';
import { getAllVaults, type VaultConfig } from '@yo-protocol/core';
import { parseAbi } from 'viem';

const erc4626Abi = parseAbi([
    'function balanceOf(address account) view returns (uint256)',
    'function convertToAssets(uint256 shares) view returns (uint256)',
    'function decimals() view returns (uint8)',
]);

export function useAppPositions() {
    const { address } = useAccount();
    const chainId = useChainId();
    const vaults: VaultConfig[] = getAllVaults().filter(v => APP_VAULTS.includes(v.symbol as typeof APP_VAULTS[number]));

    const getResolvedChain = (v: VaultConfig) => ((v.chains as number[])?.includes(8453) ? 8453 : ((v.chains as number[])?.[0] || 8453)) as 1 | 8453;

    // 1. Fetch share balances using dynamic chainIds
    const balanceContracts = vaults.map(v => ({
        address: v.address,
        abi: erc4626Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        chainId: getResolvedChain(v)
    }));

    const { data: shareBalances, refetch: refetchShares, isLoading: isSharesLoading } = useReadContracts({
        contracts: address ? balanceContracts : [],
        query: {
            enabled: !!address,
            staleTime: 10_000,
        }
    });

    // 2. Fetch converted assets
    const convertContracts = vaults.map((v, i) => {
        // Use the raw result for the contract call, it will be 0n if not successful or 0
        const shares = (shareBalances?.[i]?.result as unknown as bigint) || 0n;
        return {
            address: v.address,
            abi: erc4626Abi,
            functionName: 'convertToAssets',
            args: [shares],
            chainId: getResolvedChain(v)
        };
    });

    const { data: assetBalances, refetch: refetchAssets, isLoading: isAssetsLoading } = useReadContracts({
        contracts: shareBalances ? convertContracts : [],
        query: {
            enabled: !!shareBalances && shareBalances.some(b => (b.result as unknown as bigint) > 0n),
            staleTime: 10_000,
        }
    });

    // 3. Decimals (static read)
    const decimalContracts = vaults.map(v => ({
        address: v.address,
        abi: erc4626Abi,
        functionName: 'decimals',
        chainId: getResolvedChain(v)
    }));
    const { data: decimalsData } = useReadContracts({
        contracts: decimalContracts,
        query: { staleTime: Infinity }
    });

    // Effect to refetch on chain change
    useEffect(() => {
        if (address) {
            refetchShares();
            refetchAssets();
        }
    }, [chainId, address, refetchShares, refetchAssets]);

    const positions = vaults.map((vault, i) => {
        const shareRes = shareBalances?.[i];
        const assetRes = assetBalances?.[i];

        const shares = shareRes?.status === 'success' ? (shareRes.result as unknown as bigint) : 0n;
        const assets = assetRes?.status === 'success' ? (assetRes.result as unknown as bigint) : 0n;
        const decimals = (decimalsData?.[i]?.result as unknown as number) || vault.underlying.decimals;

        return {
            vault,
            shares,
            assets,
            decimals,
            hasPosition: shares > 0n,
            status: shareRes?.status
        };
    });

    const refetch = () => {
        refetchShares();
        refetchAssets();
    };

    const isLoading = isSharesLoading || isAssetsLoading;

    return { positions, refetch, isLoading };
}
