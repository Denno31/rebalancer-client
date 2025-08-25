import { Trade } from './tradeTypes';

export interface Bot {
    id: number;
    name: string;
    enabled: boolean;
    coins: string[] | string;
    thresholdPercentage: number;
    checkInterval: number;
    initialCoin: string;
    allocationPercentage?: number;
    manualBudgetAmount?: number;
    currentCoin: string | null;
    accountId: string;
    lastCheckTime?: string;
    activeTradeId?: string;
    userId: number;
    referenceCoin?: string;
    maxGlobalEquivalent?: number;
    globalThresholdPercentage?: number;
    takeProfitPercentage?: number;
    globalPeakValue?: number;
    minAcceptableValue?: number;
    globalPeakValueInETH?: number;
    commissionRate?: number;
    totalCommissionsPaid?: number;
    priceSource?: string;
    preferredStablecoin?: string;
    useTakeProfit?: boolean;
    createdAt?: string;
    updatedAt?: string;
    tradeStats?:{
        totalTrades:number,
        successfulTrades:number,
        successRate:number
    }
}

export interface BotStats {
    totalTrades: number;
    totalProfit: number;
    winRate: number;
    averageHoldTime: number;
    bestTrade: Trade | null;
    worstTrade: Trade | null;
}

// Helper function to parse coins string into array
export const getCoinsArray = (coinsString: string): string[] => {
    return coinsString ? coinsString.split(',') : [];
};

// Helper function to convert coins array to string
export const setCoinsArray = (coinsArray: string[]): string => {
    return coinsArray.join(',');
};