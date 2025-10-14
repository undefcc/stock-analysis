import { StockFileData, StockData } from '../types';

/**
 * 计算移动平均线
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return 0;
  }
  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return sum / period;
}

/**
 * 获取指定日期之前N天的收盘价数组
 */
function getClosePricesBeforeDate(dayRecords: any[], dateIndex: number, period: number): number[] {
  const startIndex = Math.max(0, dateIndex - period + 1);
  const endIndex = dateIndex + 1;
  return dayRecords.slice(startIndex, endIndex).map(record => record.closePrice);
}

/**
 * 高于历史区间配置
 */
export interface HigherThanHistoryConfig {
  lookbackDays: number;   // 回看天数 (默认10天)
  minimumRange: number;   // 最小超过历史价格的百分比 (默认1%)
  maxPriceRangePercent: number; // 时间范围内最高最低价差值百分比限制 (默认20%)
  targetDateIndex?: number; // 指定日期的索引（从最新开始，0表示当天，默认为0）
  ma20DiffPercent: number; // 与20日均线相差百分比 (默认2%)
  ma20ConsecutiveDays: number; // 前N天每天的20日均线都高于历史 (默认5天)
}

/**
 * 默认高于历史区间配置
 */
export const DEFAULT_HIGHER_THAN_HISTORY_CONFIG: HigherThanHistoryConfig = {
  lookbackDays: 10,      // 回看天数 (默认10天)
  minimumRange: 0.1,     // 最小超过历史价格的百分比 (默认0.1%)
  maxPriceRangePercent: 20, // 时间范围内最高最低价差值百分比限制 (默认20%)
  targetDateIndex: 0,    // 默认当天
  ma20DiffPercent: 2,    // 与20日均线相差2%
  ma20ConsecutiveDays: 5 // 前5天每天的20日均线都高
};

/**
 * 分析股票收盘价是否高于前N天的开盘价和收盘价，并包含新增条件
 */
export function analyzeHigherThanHistory(
  stockData: StockFileData,
  config: HigherThanHistoryConfig = DEFAULT_HIGHER_THAN_HISTORY_CONFIG
): StockData | null {
  const { stockCode, stockName, dayRecords } = stockData;
  
  // 检查数据是否足够（需要125天用于计算125日均线）
  const recordCount = dayRecords.length;
  const targetDateIndex = config.targetDateIndex || 0;
  const minRequiredDays = Math.max(config.lookbackDays + 1, 125, targetDateIndex + 1);
  
  if (recordCount < minRequiredDays) {
    console.warn(`股票 ${stockCode} 数据不足，仅有 ${recordCount} 条记录，需要至少 ${minRequiredDays} 条`);
    return null;
  }
  
  // 确定目标日期索引（从最新开始计算）
  const targetIndex = recordCount - 1 - targetDateIndex;
  const targetRecord = dayRecords[targetIndex];
  const targetClose = targetRecord.closePrice;
  
  // 条件1: 检查当天收盘价是否高于前一个月（30天）每天的开盘价或收盘价
  const lookbackStartIdx = Math.max(0, targetIndex - config.lookbackDays);
  const lookbackEndIdx = targetIndex - 1;
  
  let isHigherThanHistory = true;
  for (let i = lookbackStartIdx; i <= lookbackEndIdx; i++) {
    const record = dayRecords[i];
    if (targetClose <= record.openPrice || targetClose <= record.closePrice) {
      isHigherThanHistory = false;
      break;
    }
  }
  
  if (!isHigherThanHistory) {
    return null;
  }
  
  // 条件2: 检查目标日期的价格与20日均线相差是否在指定范围内
  if (targetIndex < 19) { // 需要至少20天数据计算20日均线
    return null;
  }
  
  const targetMA20Prices = getClosePricesBeforeDate(dayRecords, targetIndex, 20);
  const targetMA20 = calculateMA(targetMA20Prices, 20);
  const ma20DiffPercent = Math.abs((targetClose - targetMA20) / targetMA20) * 100;
  
  if (ma20DiffPercent > config.ma20DiffPercent) {
    return null;
  }
  
  // 条件3: 检查目标日期前5天每天的20日均线都高于历史
  const consecutiveDays = config.ma20ConsecutiveDays;
  if (targetIndex < 19 + consecutiveDays) {
    return null;
  }
  
  let allMA20Higher = true;
  for (let i = 1; i <= consecutiveDays; i++) {
    const checkIndex = targetIndex - i;
    const ma20Prices = getClosePricesBeforeDate(dayRecords, checkIndex, 20);
    const ma20 = calculateMA(ma20Prices, 20);
    
    // 检查这一天的20日均线是否高于之前所有天的开盘价和收盘价
    let isDayMA20Higher = true;
    for (let j = lookbackStartIdx; j <= Math.min(checkIndex - 1, lookbackEndIdx); j++) {
      const historyRecord = dayRecords[j];
      if (ma20 <= historyRecord.openPrice || ma20 <= historyRecord.closePrice) {
        isDayMA20Higher = false;
        break;
      }
    }
    
    if (!isDayMA20Higher) {
      allMA20Higher = false;
      break;
    }
  }
  
  if (!allMA20Higher) {
    return null;
  }
  
  // 条件4: 检查目标日期的20日均线是否高于125日均线
  if (targetIndex < 124) { // 需要至少125天数据计算125日均线
    return null;
  }
  
  const targetMA125Prices = getClosePricesBeforeDate(dayRecords, targetIndex, 125);
  const targetMA125 = calculateMA(targetMA125Prices, 125);
  
  if (targetMA20 <= targetMA125) {
    return null;
  }
  
  // 检查区间内最高最低价差值百分比限制
  let maxPrice = -Infinity;
  let minPrice = Infinity;
  for (let i = lookbackStartIdx; i <= lookbackEndIdx; i++) {
    const record = dayRecords[i];
    if (record.highPrice > maxPrice) maxPrice = record.highPrice;
    if (record.lowPrice < minPrice) minPrice = record.lowPrice;
  }
  const priceRangePercent = ((maxPrice - minPrice) / minPrice) * 100;
  
  if (priceRangePercent > config.maxPriceRangePercent) {
    return null;
  }
  
  // 计算结果数据
  const highestPriceInPeriod = Math.max(
    ...dayRecords.slice(lookbackStartIdx, lookbackEndIdx + 1)
      .map(r => Math.max(r.openPrice, r.closePrice))
  );
  
  const percentAboveHighest = ((targetClose - highestPriceInPeriod) / highestPriceInPeriod) * 100;
  
  if (percentAboveHighest >= config.minimumRange) {
    return {
      stockCode,
      stockName,
      maxPriceDate: targetRecord.date,
      minPriceDate: dayRecords[lookbackStartIdx].date,
      maxPrice: targetClose,
      minPrice: highestPriceInPeriod,
      decreasePercent: Math.round(percentAboveHighest * 100) / 100,
      volumeRatio: 0,
      minPriceDayCount: targetIndex - lookbackStartIdx,
      downDayCount: 0
    };
  }
  
  return null;
}

/**
 * 批量分析多只股票 - 高于历史区间算法
 */
export function batchAnalyzeHigherThanHistory(
  stockDataList: StockFileData[],
  config: HigherThanHistoryConfig = DEFAULT_HIGHER_THAN_HISTORY_CONFIG
): StockData[] {
  const results: StockData[] = [];
  console.log('start batchAnalyzeHigherThanHistory');
  
  for (const stockData of stockDataList) {
    const result = analyzeHigherThanHistory(stockData, config);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}
