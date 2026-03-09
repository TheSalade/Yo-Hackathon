import { useReadContracts, useAccount } from 'wagmi';
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

    const { data: shareBalances, refetch: refetchShares } = useReadContracts({
        contracts: address ? balanceContracts : [],
        query: { enabled: !!address }
    });

    // 2. Fetch converted assets
    const convertContracts = vaults.map((v, i) => {
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
        query: { enabled: !!shareBalances }
    });

    // 3. Decimals (static read)
    const decimalContracts = vaults.map(v => ({
        address: v.address,
        abi: erc4626Abi,
        functionName: 'decimals',
        chainId: getResolvedChain(v)
    }));
    const { data: decimalsData } = useReadContracts({
        contracts: decimalContracts
    });

    const positions = vaults.map((vault, i) => {
        const shares = (shareBalances?.[i]?.result as unknown as bigint) || 0n;
        const assets = (assetBalances?.[i]?.result as unknown as bigint) || 0n;
        const decimals = (decimalsData?.[i]?.result as unknown as number) || vault.underlying.decimals;
        return {
            vault,
            shares,
            assets,
            decimals,
            hasPosition: shares > 0n
        };
    });

    const refetch = () => {
        refetchShares();
        refetchAssets();
    };

    return { positions, refetch, isLoading: isAssetsLoading };
}
