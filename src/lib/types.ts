export interface DayRecord {
  date: string
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  volume: number
  amount: number
}

export interface StockFileData {
  stockCode: string
  stockName: string
  dayRecords: DayRecord[]
}

export interface StockAnalysisResult {
  stockCode: string
  stockName: string
  maxPriceDate: string
  minPriceDate: string
  decreasePercent: number
  volumeRatio: number
  minPriceDayCount: number  // 最低价距今天数
  downDayCount: number      // 从最高价到最低价的天数
}

export interface StockData {
  stockCode: string
  stockName: string
  maxPriceDate: string
  minPriceDate: string
  decreasePercent: number
  volumeRatio: number
  minPriceDayCount?: number  // 最低价距今天数
  downDayCount?: number      // 从最高价到最低价的天数
  maxPrice?: number          // 最高价
  minPrice?: number          // 最低价
  consecutiveDownDays?: number // 连续下跌天数（最大跌幅算法专用）
}

// 股票搜索配置参数 - 滑动窗口算法
export interface StockSearchConfig {
  windowSize: number         // 滑动窗口大小 (默认6天)
  searchDays: number         // 搜索天数 (默认250天)
  minPriceDecreasePercent: number // 最小价格下跌百分比阈值 (默认20%)
  maxPriceDecreasePercent: number // 最大价格下跌百分比阈值 (默认100%)
  volumeRatio: number        // 成交量比例 (默认4)
}

// 算法类型枚举
export enum AnalysisAlgorithm {
  SlidingWindow = "滑动窗口算法",
  HigherThanHistory = "高于历史区间算法"
}

// 配置历史记录接口
export interface ConfigHistoryItem<T> {
  id: string;       // 唯一标识
  timestamp: number; // 创建时间戳
  config: T;        // 配置内容
  tag: string;      // 标签名称
}

// 滑动窗口算法配置历史
export type SlidingWindowConfigHistory = ConfigHistoryItem<StockSearchConfig>;

// 高于历史区间配置
export interface HigherThanHistoryConfig {
  lookbackDays: number;   // 回看天数 (默认30天)
  minimumRange: number;   // 最小超过历史价格的百分比 (默认1%)
}

// 高于历史区间算法配置历史
export type HigherThanHistoryConfigHistory = ConfigHistoryItem<HigherThanHistoryConfig>;
