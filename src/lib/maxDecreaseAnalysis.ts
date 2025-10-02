// 为了保持向后兼容性，将旧路径的引用重定向到新的算法模块
import { 
  DEFAULT_MAX_DECREASE_CONFIG,
  analyzeMaxDecrease,
  batchAnalyzeMaxDecrease
} from './algorithms/maxDecrease';

export {
  DEFAULT_MAX_DECREASE_CONFIG,
  analyzeMaxDecrease,
  batchAnalyzeMaxDecrease
};
