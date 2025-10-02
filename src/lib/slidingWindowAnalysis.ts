// 为了保持向后兼容性，将旧路径的引用重定向到新的算法模块
import {
  DEFAULT_STOCK_SEARCH_CONFIG,
  analyzeSlidingWindow,
  batchAnalyzeSlidingWindow
} from './algorithms/slidingWindow';

export {
  DEFAULT_STOCK_SEARCH_CONFIG,
  analyzeSlidingWindow,
  batchAnalyzeSlidingWindow
};
