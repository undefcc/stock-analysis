'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { StockData, StockSearchConfig, HigherThanHistoryConfig, AnalysisAlgorithm, SlidingWindowConfigHistory, HigherThanHistoryConfigHistory } from '@/lib/types'
import { saveDataset, getDatasets, getStockDataByDatasetId, getRawStockDataByDatasetId, deleteDataset } from '@/lib/indexedDB'
import { DEFAULT_STOCK_SEARCH_CONFIG, batchAnalyzeSlidingWindow } from '@/lib/slidingWindowAnalysis'
import { DEFAULT_HIGHER_THAN_HISTORY_CONFIG, batchAnalyzeHigherThanHistory } from '@/lib/algorithms/higherThanHistory'

interface DatasetInfo {
  id: string;
  name: string;
  date: string;
  count: number;
}

interface StockDataContextType {
  // 算法和数据状态
  activeAlgorithm: AnalysisAlgorithm
  setActiveAlgorithm: (algorithm: AnalysisAlgorithm) => void
  slidingWindowData: StockData[]
  setSlidingWindowData: (data: StockData[]) => void
  higherThanHistoryData: StockData[]
  setHigherThanHistoryData: (data: StockData[]) => void
  
  // 搜索和排序
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: 'minPriceDate' | 'decreasePercent' | 'volumeRatio' | 'minPriceDayCount' | 'downDayCount'
  setSortBy: (sort: 'minPriceDate' | 'decreasePercent' | 'volumeRatio' | 'minPriceDayCount' | 'downDayCount') => void
  
  // 过滤后的数据
  filteredSlidingWindowData: StockData[]
  filteredHigherThanHistoryData: StockData[]
  currentFilteredData: StockData[]
  
  // 配置相关
  showConfig: boolean
  setShowConfig: (show: boolean) => void
  slidingWindowConfig: StockSearchConfig
  setSlidingWindowConfig: (config: StockSearchConfig) => void
  higherThanHistoryConfig: HigherThanHistoryConfig
  setHigherThanHistoryConfig: (config: HigherThanHistoryConfig) => void
  tempSlidingWindowConfig: StockSearchConfig
  setTempSlidingWindowConfig: (config: StockSearchConfig) => void
  tempHigherThanHistoryConfig: HigherThanHistoryConfig
  setTempHigherThanHistoryConfig: (config: HigherThanHistoryConfig) => void
  
  // 配置历史
  showConfigHistory: boolean
  setShowConfigHistory: (show: boolean) => void
  slidingWindowConfigHistory: SlidingWindowConfigHistory[]
  higherThanHistoryConfigHistory: HigherThanHistoryConfigHistory[]
  isEditingTag: string | null
  setIsEditingTag: (id: string | null) => void
  currentTagValue: string
  setCurrentTagValue: (value: string) => void
  
  // 数据集管理
  datasets: DatasetInfo[]
  setDatasets: (datasets: DatasetInfo[]) => void
  currentDatasetId: string
  setCurrentDatasetId: (id: string) => void
  showDatasets: boolean
  setShowDatasets: (show: boolean) => void
  dataSource: 'mock' | 'uploaded' | 'dataset'
  setDataSource: (source: 'mock' | 'uploaded' | 'dataset') => void
  
  // UI状态
  showUpload: boolean
  setShowUpload: (show: boolean) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // 算法loading状态
  isAnalyzing: boolean
  analyzingAlgorithm: AnalysisAlgorithm | null
  
  // 进度状态
  processingProgress: number
  setProcessingProgress: (progress: number) => void
  processingStatus: string
  setProcessingStatus: (status: string) => void
  
  // 方法
  applySlidingWindowConfig: () => void
  applyHigherThanHistoryConfig: () => void
  applyHistoryConfig: (algorithm: AnalysisAlgorithm, config: StockSearchConfig | HigherThanHistoryConfig) => void
  addToConfigHistory: (algorithm: AnalysisAlgorithm, config: StockSearchConfig | HigherThanHistoryConfig) => void
  updateConfigHistoryTag: (algorithm: AnalysisAlgorithm, configId: string, newTag: string) => void
  deleteConfigHistory: (algorithm: AnalysisAlgorithm, configId: string) => void
  handleSelectDataset: (datasetId: string) => void
  handleDeleteDataset: (datasetId: string) => void
  handleAnalyzeDataset: (datasetId: string) => void
  handleFileProcessComplete: (data: { rawData: any[]; analysisResults: any[] }, saveAsDataset?: boolean, datasetName?: string) => void
}

const StockDataContext = createContext<StockDataContextType | undefined>(undefined)

export const useStockData = () => {
  const context = useContext(StockDataContext)
  if (context === undefined) {
    throw new Error('useStockData must be used within a StockDataProvider')
  }
  return context
}

interface StockDataProviderProps {
  children: ReactNode
}

export function StockDataProvider({ children }: StockDataProviderProps) {
  // 算法和数据状态
  const [activeAlgorithm, setActiveAlgorithm] = useState<AnalysisAlgorithm>(AnalysisAlgorithm.SlidingWindow)
  const [slidingWindowData, setSlidingWindowData] = useState<StockData[]>([])
  const [higherThanHistoryData, setHigherThanHistoryData] = useState<StockData[]>([])
  
  // 搜索和排序
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'minPriceDate' | 'decreasePercent' | 'volumeRatio' | 'minPriceDayCount' | 'downDayCount'>('minPriceDate')
  
  // 配置相关
  const [showConfig, setShowConfig] = useState(false)
  const [slidingWindowConfig, setSlidingWindowConfig] = useState<StockSearchConfig>({...DEFAULT_STOCK_SEARCH_CONFIG})
  const [higherThanHistoryConfig, setHigherThanHistoryConfig] = useState<HigherThanHistoryConfig>({...DEFAULT_HIGHER_THAN_HISTORY_CONFIG})
  const [tempSlidingWindowConfig, setTempSlidingWindowConfig] = useState<StockSearchConfig>({...DEFAULT_STOCK_SEARCH_CONFIG})
  const [tempHigherThanHistoryConfig, setTempHigherThanHistoryConfig] = useState<HigherThanHistoryConfig>({...DEFAULT_HIGHER_THAN_HISTORY_CONFIG})
  
  // 配置历史
  const [showConfigHistory, setShowConfigHistory] = useState(false)
  const [slidingWindowConfigHistory, setSlidingWindowConfigHistory] = useState<SlidingWindowConfigHistory[]>([])
  const [higherThanHistoryConfigHistory, setHigherThanHistoryConfigHistory] = useState<HigherThanHistoryConfigHistory[]>([])
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null)
  const [currentTagValue, setCurrentTagValue] = useState('')
  
  // 数据集管理
  const [datasets, setDatasets] = useState<DatasetInfo[]>([])
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('')
  const [showDatasets, setShowDatasets] = useState(false)
  const [dataSource, setDataSource] = useState<'mock' | 'uploaded' | 'dataset'>('dataset')
  
  // UI状态
  const [showUpload, setShowUpload] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // 算法loading状态
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzingAlgorithm, setAnalyzingAlgorithm] = useState<AnalysisAlgorithm | null>(null)
  
  // 进度状态
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState('')

  // 计算过滤后的数据
  const filteredSlidingWindowData = slidingWindowData
    .filter(stock => 
      stock.stockCode.includes(searchTerm) || 
      stock.stockName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'minPriceDate') {
        return new Date(b.minPriceDate).getTime() - new Date(a.minPriceDate).getTime();
      } else if (sortBy === 'decreasePercent') {
        return b.decreasePercent - a.decreasePercent;
      } else if (sortBy === 'volumeRatio') {
        return b.volumeRatio - a.volumeRatio;
      } else if (sortBy === 'minPriceDayCount') {
        return (a.minPriceDayCount || 0) - (b.minPriceDayCount || 0);
      } else {
        return (b.downDayCount || 0) - (a.downDayCount || 0);
      }
    });
    
  const filteredHigherThanHistoryData = higherThanHistoryData
    .filter(stock => 
      stock.stockCode.includes(searchTerm) || 
      stock.stockName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'minPriceDate') {
        return new Date(b.minPriceDate).getTime() - new Date(a.minPriceDate).getTime();
      } else if (sortBy === 'decreasePercent') {
        return b.decreasePercent - a.decreasePercent;
      } else if (sortBy === 'volumeRatio') {
        return b.volumeRatio - a.volumeRatio;
      } else if (sortBy === 'minPriceDayCount') {
        return (a.minPriceDayCount || 0) - (b.minPriceDayCount || 0);
      } else {
        return (b.downDayCount || 0) - (a.downDayCount || 0);
      }
    });

  const currentFilteredData = activeAlgorithm === AnalysisAlgorithm.SlidingWindow
    ? filteredSlidingWindowData
    : filteredHigherThanHistoryData;

  // 数据集分析方法
  const handleAnalyzeDataset = useCallback(async (datasetId: string) => {
    try {
      setIsAnalyzing(true);
      setAnalyzingAlgorithm(activeAlgorithm);
      setIsProcessing(true);
      
      // 获取原始数据
      const rawData = await getRawStockDataByDatasetId(datasetId);
      
      if (rawData.length === 0) {
        console.warn('没有找到数据集的原始数据:', datasetId);
        return;
      }
      
      // 模拟延迟，让用户看到loading状态
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 根据当前活跃算法进行分析
      if (activeAlgorithm === AnalysisAlgorithm.SlidingWindow) {
        const results = batchAnalyzeSlidingWindow(rawData, slidingWindowConfig);
        setSlidingWindowData(results);
      } else {
        const results = batchAnalyzeHigherThanHistory(rawData, higherThanHistoryConfig);
        setHigherThanHistoryData(results);
      }
      
      console.log('数据集分析完成:', datasetId);
    } catch (error) {
      console.error('分析数据集失败:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingAlgorithm(null);
      setIsProcessing(false);
    }
  }, [activeAlgorithm, slidingWindowConfig, higherThanHistoryConfig]);

  // 加载配置历史记录和数据集
  useEffect(() => {
    const initializeData = async () => {
      const loadConfigHistory = () => {
        try {
          const slidingWindowHistory = localStorage.getItem('slidingWindowConfigHistory');
          if (slidingWindowHistory) {
            setSlidingWindowConfigHistory(JSON.parse(slidingWindowHistory));
          }
          
          const higherThanHistoryHistory = localStorage.getItem('higherThanHistoryConfigHistory');
          if (higherThanHistoryHistory) {
            setHigherThanHistoryConfigHistory(JSON.parse(higherThanHistoryHistory));
          }
        } catch (error) {
          console.error('加载配置历史记录失败:', error);
        }
      };
      
      const loadDatasets = async () => {
        try {
          const datasetList = await getDatasets();
          setDatasets(datasetList);
          
          // 如果有数据集且没有选择当前数据集，自动选择第一个
          if (datasetList.length > 0 && !currentDatasetId) {
            const firstDatasetId = datasetList[0].id;
            setCurrentDatasetId(firstDatasetId);
            setDataSource('dataset');
          }
        } catch (error) {
          console.error('加载数据集失败:', error);
        }
      };
      
      loadConfigHistory();
      await loadDatasets();
      // 初始化完成，设置 loading 为 false
      setLoading(false);
    };
    
    initializeData();
  }, [currentDatasetId]);

  // 打开配置面板时更新临时配置
  useEffect(() => {
    if (showConfig) {
      setTempSlidingWindowConfig({...slidingWindowConfig});
      setTempHigherThanHistoryConfig({...higherThanHistoryConfig});
    }
  }, [showConfig, slidingWindowConfig, higherThanHistoryConfig]);

  // 当数据集改变时自动分析
  useEffect(() => {
    if (currentDatasetId && dataSource === 'dataset') {
      handleAnalyzeDataset(currentDatasetId);
    }
  }, [currentDatasetId, dataSource, handleAnalyzeDataset]);

  // 配置相关方法
  const addToConfigHistory = (algorithm: AnalysisAlgorithm, config: StockSearchConfig | HigherThanHistoryConfig) => {
    const timestamp = Date.now();
    const id = `config-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultTag = `配置 ${new Date().toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    if (algorithm === AnalysisAlgorithm.SlidingWindow) {
      const newHistory = [
        { id, timestamp, config: config as StockSearchConfig, tag: defaultTag },
        ...slidingWindowConfigHistory
      ].slice(0, 3);
      
      setSlidingWindowConfigHistory(newHistory);
      localStorage.setItem('slidingWindowConfigHistory', JSON.stringify(newHistory));
    } else {
      const newHistory = [
        { id, timestamp, config: config as HigherThanHistoryConfig, tag: defaultTag },
        ...higherThanHistoryConfigHistory
      ].slice(0, 3);
      
      setHigherThanHistoryConfigHistory(newHistory);
      localStorage.setItem('higherThanHistoryConfigHistory', JSON.stringify(newHistory));
    }
  };

  const updateConfigHistoryTag = (algorithm: AnalysisAlgorithm, configId: string, newTag: string) => {
    if (algorithm === AnalysisAlgorithm.SlidingWindow) {
      const updatedHistory = slidingWindowConfigHistory.map(item => 
        item.id === configId ? { ...item, tag: newTag } : item
      );
      
      setSlidingWindowConfigHistory(updatedHistory);
      localStorage.setItem('slidingWindowConfigHistory', JSON.stringify(updatedHistory));
    } else {
      const updatedHistory = higherThanHistoryConfigHistory.map(item => 
        item.id === configId ? { ...item, tag: newTag } : item
      );
      
      setHigherThanHistoryConfigHistory(updatedHistory);
      localStorage.setItem('higherThanHistoryConfigHistory', JSON.stringify(updatedHistory));
    }
  };

  const deleteConfigHistory = (algorithm: AnalysisAlgorithm, configId: string) => {
    if (algorithm === AnalysisAlgorithm.SlidingWindow) {
      const updatedHistory = slidingWindowConfigHistory.filter(item => item.id !== configId);
      setSlidingWindowConfigHistory(updatedHistory);
      localStorage.setItem('slidingWindowConfigHistory', JSON.stringify(updatedHistory));
    } else {
      const updatedHistory = higherThanHistoryConfigHistory.filter(item => item.id !== configId);
      setHigherThanHistoryConfigHistory(updatedHistory);
      localStorage.setItem('higherThanHistoryConfigHistory', JSON.stringify(updatedHistory));
    }
  };

  const applyHistoryConfig = (algorithm: AnalysisAlgorithm, config: StockSearchConfig | HigherThanHistoryConfig) => {
    if (algorithm === AnalysisAlgorithm.SlidingWindow) {
      setSlidingWindowConfig(config as StockSearchConfig);
      setTempSlidingWindowConfig(config as StockSearchConfig);
    } else {
      setHigherThanHistoryConfig(config as HigherThanHistoryConfig);
      setTempHigherThanHistoryConfig(config as HigherThanHistoryConfig);
    }
    
    setShowConfigHistory(false);
    
    if (dataSource === 'dataset' && currentDatasetId) {
      handleAnalyzeDataset(currentDatasetId);
    }
  };

  const applySlidingWindowConfig = () => {
    const newConfig = {...tempSlidingWindowConfig};
    setSlidingWindowConfig(newConfig);
    setShowConfig(false);
    
    addToConfigHistory(AnalysisAlgorithm.SlidingWindow, newConfig);
    
    if (dataSource === 'dataset' && currentDatasetId) {
      handleAnalyzeDataset(currentDatasetId);
    }
  };

  const applyHigherThanHistoryConfig = () => {
    const newConfig = {...tempHigherThanHistoryConfig};
    setHigherThanHistoryConfig(newConfig);
    setShowConfig(false);
    
    addToConfigHistory(AnalysisAlgorithm.HigherThanHistory, newConfig);
    
    if (dataSource === 'dataset' && currentDatasetId) {
      handleAnalyzeDataset(currentDatasetId);
    }
  };

  // 数据集相关方法
  const handleSelectDataset = async (datasetId: string) => {
    setCurrentDatasetId(datasetId)
    setDataSource('dataset')
    setShowDatasets(false)
    
    // 用户主动选择数据集时显示进度条
    await handleAnalyzeDataset(datasetId)
  }

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      await deleteDataset(datasetId)
      const updatedDatasets = await getDatasets()
      setDatasets(updatedDatasets)
      
      if (datasetId === currentDatasetId) {
        setCurrentDatasetId('')
        if (updatedDatasets.length > 0) {
          setCurrentDatasetId(updatedDatasets[0].id)
        }
      }
    } catch (error) {
      console.error('删除数据集失败:', error)
    }
  }

  const handleFileProcessComplete = async (data: { rawData: any[]; analysisResults: any[] }, saveAsDataset?: boolean, datasetName?: string) => {
    try {
      setIsProcessing(true);
      // 不要重置进度，让FileUpload组件控制进度
      setProcessingStatus('正在处理数据...');
      
      if (saveAsDataset && data.rawData.length > 0) {
        // 如果没有提供数据集名称，使用默认名称
        const finalDatasetName = datasetName || `数据集 ${new Date().toLocaleString('zh-CN')}`;
        // 保存为数据集
        const datasetId = await saveDataset(finalDatasetName, {
          processedData: data.analysisResults || [],
          rawData: data.rawData
        });
        
        // 更新数据集列表
        const updatedDatasets = await getDatasets();
        setDatasets(updatedDatasets);
        
        // 选择新创建的数据集
        setCurrentDatasetId(datasetId);
        setDataSource('dataset');
        
        // 分析新数据集（保存数据集后不再显示进度条，避免与文件上传进度条冲突）
        // 直接分析数据而不显示进度条
        const rawData = await getRawStockDataByDatasetId(datasetId);
        if (rawData.length > 0) {
          setIsAnalyzing(true);
          setAnalyzingAlgorithm(activeAlgorithm);
          
          if (activeAlgorithm === AnalysisAlgorithm.SlidingWindow) {
            const results = batchAnalyzeSlidingWindow(rawData, slidingWindowConfig);
            setSlidingWindowData(results);
          } else {
            const results = batchAnalyzeHigherThanHistory(rawData, higherThanHistoryConfig);
            setHigherThanHistoryData(results);
          }
          
          setIsAnalyzing(false);
          setAnalyzingAlgorithm(null);
        }
      } else {
        // 直接使用上传的数据
        if (data.rawData.length > 0) {
          setIsAnalyzing(true);
          setAnalyzingAlgorithm(activeAlgorithm);
          
          // 根据当前算法分析数据
          if (activeAlgorithm === AnalysisAlgorithm.SlidingWindow) {
            const results = batchAnalyzeSlidingWindow(data.rawData, slidingWindowConfig);
            setSlidingWindowData(results);
          } else {
            const results = batchAnalyzeHigherThanHistory(data.rawData, higherThanHistoryConfig);
            setHigherThanHistoryData(results);
          }
          
          setIsAnalyzing(false);
          setAnalyzingAlgorithm(null);
          setDataSource('uploaded');
        }
      }
      
      setShowUpload(false);
    } catch (error) {
      console.error('文件处理失败:', error);
      alert(`文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      // 延迟一下让用户看到100%的进度
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingStatus('');
      }, 1000);
    }
  };

  const value: StockDataContextType = {
    // 算法和数据状态
    activeAlgorithm,
    setActiveAlgorithm,
    slidingWindowData,
    setSlidingWindowData,
    higherThanHistoryData,
    setHigherThanHistoryData,
    
    // 搜索和排序
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    
    // 过滤后的数据
    filteredSlidingWindowData,
    filteredHigherThanHistoryData,
    currentFilteredData,
    
    // 配置相关
    showConfig,
    setShowConfig,
    slidingWindowConfig,
    setSlidingWindowConfig,
    higherThanHistoryConfig,
    setHigherThanHistoryConfig,
    tempSlidingWindowConfig,
    setTempSlidingWindowConfig,
    tempHigherThanHistoryConfig,
    setTempHigherThanHistoryConfig,
    
    // 配置历史
    showConfigHistory,
    setShowConfigHistory,
    slidingWindowConfigHistory,
    higherThanHistoryConfigHistory,
    isEditingTag,
    setIsEditingTag,
    currentTagValue,
    setCurrentTagValue,
    
    // 数据集管理
    datasets,
    setDatasets,
    currentDatasetId,
    setCurrentDatasetId,
    showDatasets,
    setShowDatasets,
    dataSource,
    setDataSource,
    
    // UI状态
    showUpload,
    setShowUpload,
    isProcessing,
    setIsProcessing,
    loading,
    setLoading,
    
    // 算法loading状态
    isAnalyzing,
    analyzingAlgorithm,
    
    // 进度状态
    processingProgress,
    setProcessingProgress,
    processingStatus,
    setProcessingStatus,
    
    // 方法
    applySlidingWindowConfig,
    applyHigherThanHistoryConfig,
    applyHistoryConfig,
    addToConfigHistory,
    updateConfigHistoryTag,
    deleteConfigHistory,
    handleSelectDataset,
    handleDeleteDataset,
    handleAnalyzeDataset,
    handleFileProcessComplete,
  }

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  )
}
