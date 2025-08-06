export interface Trade {
    id: number;
    botId: number;
    tradeId: string;
    fromCoin: string;
    toCoin: string;
    fromAmount: number;
    toAmount: number;
    fromPrice: number;
    toPrice: number;
    commissionRate?: number;
    commissionAmount?: number;
    priceChange?: number;
    status: 'pending' | 'completed' | 'failed';
    executedAt: string;
}

export interface TradeStats {
    profitPercentage: number;
    profitAmount: number;
    durationHours: number;
    fromValue: number;
    toValue: number;
}
