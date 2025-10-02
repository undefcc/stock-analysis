import { DayRecord, StockFileData, StockData, StockSearchConfig } from '../types';

/**
 * 默认股票搜索配置 - 滑动窗口算法
 */
export const DEFAULT_STOCK_SEARCH_CONFIG: StockSearchConfig = {
  windowSize: 6,             // 滑动窗口大小 (默认6天)
  searchDays: 30,            // 搜索天数 (默认30天)
  minPriceDecreasePercent: 20,  // 最小价格下跌百分比阈值 (默认20%)
  maxPriceDecreasePercent: 100,  // 最大价格下跌百分比阈值 (默认100%)
  volumeRatio: 4             // 成交量比例 (默认4)
};

/**
 * 使用滑动窗口分析股票价格和成交量
 */
export function analyzeSlidingWindow(
  stockData: StockFileData, 
  config: StockSearchConfig = DEFAULT_STOCK_SEARCH_CONFIG
): StockData | null {
  const { stockCode, stockName, dayRecords } = stockData;
  
  const recordCount = dayRecords.length;
  if (recordCount < 10) {
    console.warn(`股票 ${stockCode} 数据不足，仅有 ${recordCount} 条记录`);
    return null;
  }
  
  // 设置最大搜索天数
  const maxSearchDays = Math.min(config.searchDays, recordCount);
  const searchStart = recordCount - maxSearchDays;
  
  const windowSize = config.windowSize;
  
  // 使用滑动窗口在搜索范围内搜索
  let foundValidPattern = false;
  let bestMaxPriceRecord: DayRecord | null = null;
  let bestMinPriceRecord: DayRecord | null = null;
  let bestMaxVolumeRecord: DayRecord | null = null;
  let bestMinVolumeRecord: DayRecord | null = null;
  let bestVolumeRatio = 0;
  let bestPriceDropPercent = 0;
  
  // 从最新交易日向前，使用滑动窗口
  for (let windowStart = recordCount - windowSize; windowStart >= searchStart; windowStart -= windowSize) {
    let windowEnd = windowStart + windowSize - 1;
    if (windowEnd >= recordCount) windowEnd = recordCount - 1;
    
    // 在当前窗口内找极值
    let windowMaxPrice = dayRecords[windowStart];
    let windowMinPrice = dayRecords[windowStart];
    
    for (let i = windowStart; i <= windowEnd; i++) {
      const current = dayRecords[i];
      
      if (current.highPrice > windowMaxPrice.highPrice) {
        windowMaxPrice = current;
      }
      if (current.lowPrice < windowMinPrice.lowPrice) {
        windowMinPrice = current;
      }
    }
    
    // 检查时间顺序：最低价必须在最高价之后
    const windowMaxPriceDate = new Date(windowMaxPrice.date);
    const windowMinPriceDate = new Date(windowMinPrice.date);
    if (windowMinPriceDate <= windowMaxPriceDate) {
      continue;
    }
    
    // 检查价格下跌条件
    const priceDropAbsolute = windowMaxPrice.highPrice - windowMinPrice.lowPrice;
    const currentPriceDropPercent = (priceDropAbsolute * 100.0) / windowMaxPrice.highPrice;
    
    // 如果下跌幅度不在指定范围内，则跳过
    if (currentPriceDropPercent < config.minPriceDecreasePercent || currentPriceDropPercent > config.maxPriceDecreasePercent) {
      continue;
    }
    
    // 在窗口范围内找成交量极值
    // 计算窗口中日期的索引位置
    const maxPriceIndex = dayRecords.findIndex(r => r.date === windowMaxPrice.date);
    const minPriceIndex = dayRecords.findIndex(r => r.date === windowMinPrice.date);
    
    const maxVolumeStart = Math.max(windowStart, maxPriceIndex - 1);
    const maxVolumeEnd = maxPriceIndex;
    const minVolumeStart = maxPriceIndex;
    const minVolumeEnd = Math.min(windowEnd, minPriceIndex + 1);
    
    let windowMaxVolume = dayRecords[maxVolumeStart];
    let windowMinVolume = dayRecords[minVolumeStart];
    
    // 搜索最大成交量
    for (let i = maxVolumeStart; i <= maxVolumeEnd; i++) {
      if (dayRecords[i].volume > 0 && dayRecords[i].volume > windowMaxVolume.volume) {
        windowMaxVolume = dayRecords[i];
      }
    }
    
    // 搜索最小成交量
    for (let i = minVolumeStart; i <= minVolumeEnd; i++) {
      if (dayRecords[i].volume > 0 && dayRecords[i].volume < windowMinVolume.volume) {
        windowMinVolume = dayRecords[i];
      }
    }
    
    if (windowMinVolume.volume === 0) {
      continue;
    }
    
    const volumeRatio = windowMaxVolume.volume / windowMinVolume.volume;
    
    // 检查成交量条件，并记录最佳结果
    if (volumeRatio >= config.volumeRatio) {
      if (!foundValidPattern || volumeRatio > bestVolumeRatio || 
          (volumeRatio === bestVolumeRatio && currentPriceDropPercent > bestPriceDropPercent)) {
        foundValidPattern = true;
        bestMaxPriceRecord = windowMaxPrice;
        bestMinPriceRecord = windowMinPrice;
        bestMaxVolumeRecord = windowMaxVolume;
        bestMinVolumeRecord = windowMinVolume;
        bestVolumeRatio = volumeRatio;
        bestPriceDropPercent = currentPriceDropPercent;
      }
    }
  }
  
  if (foundValidPattern && bestMaxPriceRecord && bestMinPriceRecord) {
    // 计算日期距离和索引位置
    const maxPriceIndex = dayRecords.findIndex(r => r.date === bestMaxPriceRecord.date);
    const minPriceIndex = dayRecords.findIndex(r => r.date === bestMinPriceRecord.date);
    
    // 填充最佳结果
    return {
      stockCode,
      stockName,
      maxPriceDate: bestMaxPriceRecord.date,
      minPriceDate: bestMinPriceRecord.date,
      maxPrice: bestMaxPriceRecord.highPrice,
      minPrice: bestMinPriceRecord.lowPrice,
      minPriceDayCount: recordCount - 1 - minPriceIndex, // 最低价距今天数
      downDayCount: minPriceIndex - maxPriceIndex,       // 从最高价到最低价的天数
      decreasePercent: Math.round(bestPriceDropPercent),
      volumeRatio: Math.round(bestVolumeRatio)
    };
  }
  
  return null;
}

/**
 * 批量分析多只股票 - 滑动窗口算法
 */
export function batchAnalyzeSlidingWindow(
  stockDataList: StockFileData[], 
  config: StockSearchConfig = DEFAULT_STOCK_SEARCH_CONFIG
): StockData[] {
  const results: StockData[] = [];
  
  for (const stockData of stockDataList) {
    const result = analyzeSlidingWindow(stockData, config);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}
