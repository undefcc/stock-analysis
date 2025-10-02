import { StockFileData, StockData } from '../types';

/**
 * 高于历史区间配置
 */
export interface HigherThanHistoryConfig {
  lookbackDays: number;   // 回看天数 (默认30天)
  minimumRange: number;   // 最小超过历史价格的百分比 (默认1%)
}

/**
 * 默认高于历史区间配置
 */
export const DEFAULT_HIGHER_THAN_HISTORY_CONFIG: HigherThanHistoryConfig = {
  lookbackDays: 30,      // 回看天数 (默认30天)
  minimumRange: 0.1        // 最小超过历史价格的百分比 (默认0.1%)
};

/**
 * 分析股票收盘价是否高于前N天的开盘价和收盘价
 */
export function analyzeHigherThanHistory(
  stockData: StockFileData,
  config: HigherThanHistoryConfig = DEFAULT_HIGHER_THAN_HISTORY_CONFIG
): StockData | null {
  const { stockCode, stockName, dayRecords } = stockData;
  
  // 检查数据是否足够
  const recordCount = dayRecords.length;
  if (recordCount < config.lookbackDays + 1) {
    console.warn(`股票 ${stockCode} 数据不足，仅有 ${recordCount} 条记录，需要至少 ${config.lookbackDays + 1} 条`);
    return null;
  }
  
  // 获取最新收盘价
  const latestRecord = dayRecords[recordCount - 1];
  const latestClose = latestRecord.closePrice;
  
  // 检查前N天的记录
  const startIdx = Math.max(0, recordCount - config.lookbackDays - 1);
  const endIdx = recordCount - 2; // 不包括最新的一天
  
  // 查找历史区间内的最高开盘价和收盘价
  let highestOpen = 0;
  let highestClose = 0;
  let highestDate = '';
  
  for (let i = startIdx; i <= endIdx; i++) {
    const record = dayRecords[i];
    
    // 更新最高开盘价
    if (record.openPrice > highestOpen) {
      highestOpen = record.openPrice;
    }
    
    // 更新最高收盘价
    if (record.closePrice > highestClose) {
      highestClose = record.closePrice;
      highestDate = record.date;
    }
  }
  
  // 计算最新收盘价超过历史最高价的百分比
  const highestPrice = Math.max(highestOpen, highestClose);
  const percentAboveHighest = ((latestClose - highestPrice) / highestPrice) * 100;
  
  // 检查是否满足条件
  if (latestClose > highestOpen && latestClose > highestClose && percentAboveHighest >= config.minimumRange) {
    // 计算高于历史区间的具体天数
    let daysAboveHistory = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      if (latestClose > dayRecords[i].openPrice && latestClose > dayRecords[i].closePrice) {
        daysAboveHistory++;
      }
    }
    
    const highestIndex = dayRecords.findIndex(r => r.date === highestDate);
    
    return {
      stockCode,
      stockName,
      maxPriceDate: latestRecord.date,  // 当前日期作为最高价日期
      minPriceDate: highestDate,        // 历史最高价日期作为参考点
      maxPrice: latestClose,            // 当前收盘价作为最高价
      minPrice: highestPrice,           // 历史最高价作为对比点
      decreasePercent: Math.round(percentAboveHighest), // 百分比差异（这里是正值，表示增长）
      volumeRatio: 0,                   // 该算法不关注成交量比例
      minPriceDayCount: recordCount - 1 - highestIndex, // 历史最高价距今天数
      downDayCount: 0                   // 不适用于此算法
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
  
  for (const stockData of stockDataList) {
    const result = analyzeHigherThanHistory(stockData, config);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}
