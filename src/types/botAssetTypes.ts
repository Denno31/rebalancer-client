export interface BotAsset {
    id: number;
    botId: number;
    coin: string;
    amount: number;
    entryPrice?: number;
    usdtEquivalent?: number;
    lastUpdated?: string;
    stablecoin: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AssetAllocation {
    coin: string;
    percentage: number;
    value: number;
    color?: string;
}

export interface AssetPerformance {
    coin: string;
    initialValue: number;
    currentValue: number;
    change: number;
    changePercentage: number;
}
