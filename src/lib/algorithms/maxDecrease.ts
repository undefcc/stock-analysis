import { DayRecord, StockFileData, StockData, MaxDecreaseConfig } from '../types';

/**
 * 默认最大跌幅分析配置
 */
export const DEFAULT_MAX_DECREASE_CONFIG: MaxDecreaseConfig = {
  minSearchDays: 30,        // 最小搜索天数 (默认30天)
  maxSearchDays: 180,       // 最大搜索天数 (默认180天)
  minDecreasePercent: 15,   // 最小跌幅百分比阈值 (默认15%)
  consecutiveDownDays: 3    // 连续下跌天数 (默认3天)
};

/**
 * 最大跌幅分析算法
 * 寻找从高点到低点的最大跌幅，同时考虑连续下跌天数
 */
export function analyzeMaxDecrease(
  stockData: StockFileData,
  config: MaxDecreaseConfig = DEFAULT_MAX_DECREASE_CONFIG
): StockData | null {
  const { stockCode, stockName, dayRecords } = stockData;
  
  const recordCount = dayRecords.length;
  if (recordCount < Math.max(config.minSearchDays, 10)) {
    console.warn(`股票 ${stockCode} 数据不足，仅有 ${recordCount} 条记录`);
    return null;
  }
  
  // 设置搜索范围
  const searchEnd = recordCount - 1;
  const searchStart = Math.max(0, recordCount - config.maxSearchDays);
  
  let maxPriceRecord: DayRecord | null = null;
  let minPriceRecord: DayRecord | null = null;
  let maxDecreasePercent = 0;
  let maxConsecutiveDownDays = 0;
  
  // 从最新数据开始向前搜索最低价格
  for (let i = searchEnd; i >= searchStart; i--) {
    const currentMin = dayRecords[i];
    
    // 从当前最低价向前搜索最高价
    for (let j = i - 1; j >= searchStart; j--) {
      const currentMax = dayRecords[j];
      
      if (currentMax.highPrice <= currentMin.lowPrice) {
        continue; // 最高价应该高于最低价
      }
      
      // 计算跌幅
      const priceDecreaseAbsolute = currentMax.highPrice - currentMin.lowPrice;
      const decreasePercent = (priceDecreaseAbsolute * 100.0) / currentMax.highPrice;
      
      if (decreasePercent < config.minDecreasePercent) {
        continue; // 跌幅不满足条件
      }
      
      // 计算从高点到低点之间的连续下跌天数
      let consecutiveDownDays = 0;
      let maxConsecutive = 0;
      for (let k = j; k <= i; k++) {
        if (k > 0 && dayRecords[k].closePrice < dayRecords[k-1].closePrice) {
          consecutiveDownDays++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveDownDays);
        } else {
          consecutiveDownDays = 0;
        }
      }
      
      // 检查是否满足连续下跌天数的条件
      if (maxConsecutive < config.consecutiveDownDays) {
        continue;
      }
      
      // 更新最佳结果
      if (maxPriceRecord === null || decreasePercent > maxDecreasePercent) {
        maxPriceRecord = currentMax;
        minPriceRecord = currentMin;
        maxDecreasePercent = decreasePercent;
        maxConsecutiveDownDays = maxConsecutive;
      }
    }
  }
  
  if (maxPriceRecord && minPriceRecord) {
    // 计算日期距离和索引位置
    const maxPriceIndex = dayRecords.findIndex(r => r.date === maxPriceRecord!.date);
    const minPriceIndex = dayRecords.findIndex(r => r.date === minPriceRecord!.date);
    
    return {
      stockCode,
      stockName,
      maxPriceDate: maxPriceRecord.date,
      minPriceDate: minPriceRecord.date,
      maxPrice: maxPriceRecord.highPrice,
      minPrice: minPriceRecord.lowPrice,
      decreasePercent: Math.round(maxDecreasePercent),
      volumeRatio: 0, // 该算法不关注成交量比例
      minPriceDayCount: recordCount - 1 - minPriceIndex, // 最低价距今天数
      downDayCount: minPriceIndex - maxPriceIndex,       // 从最高价到最低价的天数
      consecutiveDownDays: maxConsecutiveDownDays        // 连续下跌天数
    };
  }
  
  return null;
}

/**
 * 批量分析多只股票 - 最大跌幅算法
 */
export function batchAnalyzeMaxDecrease(
  stockDataList: StockFileData[], 
  config: MaxDecreaseConfig = DEFAULT_MAX_DECREASE_CONFIG
): StockData[] {
  const results: StockData[] = [];
  
  for (const stockData of stockDataList) {
    const result = analyzeMaxDecrease(stockData, config);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}
