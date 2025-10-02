// 导出所有算法模块
export * from './slidingWindow';
export * from './maxDecrease';
export * from './higherThanHistory';

// 算法类型映射
import { AnalysisAlgorithm } from '../types';
import { 
  batchAnalyzeSlidingWindow, 
  batchAnalyzeHigherThanHistory 
} from './';

// 根据算法类型选择对应的批处理函数
export function getBatchAnalysisFunction(algorithmType: AnalysisAlgorithm) {
  switch (algorithmType) {
    case AnalysisAlgorithm.SlidingWindow:
      return batchAnalyzeSlidingWindow;
    case AnalysisAlgorithm.HigherThanHistory:
      return batchAnalyzeHigherThanHistory;
    default:
      throw new Error(`未实现的算法类型: ${algorithmType}`);
  }
}
