import { Trade } from './tradeTypes';

export interface BotSwapDecision {
    id: number;
    botId: number;
    fromCoin: string;
    toCoin: string;
    
    // Price data
    fromCoinPrice: number;
    toCoinPrice: number;
    fromCoinSnapshot: number;
    toCoinSnapshot: number;
    
    // Deviation metrics
    priceDeviationPercent: number;
    priceThreshold: number;
    deviationTriggered: boolean;
    
    // Value metrics
    unitGainPercent?: number;
    ethEquivalentValue?: number;
    minEthEquivalent?: number;
    
    // Global protection
    globalPeakValue?: number;
    currentGlobalPeakValue?: number;
    globalProtectionTriggered: boolean;
    
    // Decision outcome
    swapPerformed: boolean;
    reason?: string;
    tradeId?: number;
    
    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    
    // Relations (optional, for frontend use)
    trade?: Trade;
}
