'use client'

import { Calendar, Upload as UploadIcon, Database, Settings, Download, Loader2 } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import StockChart from './StockChart'
import FileUpload from './FileUpload'
import SearchHeader from './SearchHeader'
import AlgorithmTabs from './AlgorithmTabs'
import ConfigPanel from './ConfigPanel'
import DatasetManager from './DatasetManager'
import AnalysisLoading from './AnalysisLoading'
import { StockDataProvider, useStockData } from './StockDataProvider'
import { AnalysisAlgorithm } from '@/lib/types'

// 主仪表板组件内容
function StockDashboardContent() {
  const {
    // 状态
    activeAlgorithm,
    setActiveAlgorithm,
    slidingWindowData,
    higherThanHistoryData,
    filteredSlidingWindowData,
    filteredHigherThanHistoryData,
    currentFilteredData,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    showConfig,
    setShowConfig,
    showConfigHistory,
    setShowConfigHistory,
    showDatasets,
    setShowDatasets,
    showUpload,
    setShowUpload,
    isProcessing,
    loading,
    datasets,
    setDatasets,
    currentDatasetId,
    dataSource,
    
    // 算法loading状态
    isAnalyzing,
    analyzingAlgorithm,
    
    // 配置相关
    tempSlidingWindowConfig,
    setTempSlidingWindowConfig,
    tempHigherThanHistoryConfig,
    setTempHigherThanHistoryConfig,
    slidingWindowConfigHistory,
    higherThanHistoryConfigHistory,
    applySlidingWindowConfig,
    applyHigherThanHistoryConfig,
    applyHistoryConfig,
    updateConfigHistoryTag,
    deleteConfigHistory,
    isEditingTag,
    setIsEditingTag,
    currentTagValue,
    setCurrentTagValue,
    
    // 数据集方法
    handleSelectDataset,
    handleDeleteDataset,
    handleFileProcessComplete,
  } = useStockData()

  // 导出股票代码功能
  const handleExportStockCodes = () => {
    if (currentFilteredData.length === 0) {
      alert('没有符合条件的股票数据可导出')
      return
    }

    const stockCodes = currentFilteredData.map(stock => {
      const code = stock.stockCode
      const prefix = code.startsWith('6') ? 'SH' : 'SZ'
      return `${prefix}${code}`
    }).join('\n')

    let fileName = 'stock_codes'
    if (activeAlgorithm === AnalysisAlgorithm.SlidingWindow) {
      fileName = `SW_stocks_${new Date().toISOString().split('T')[0]}.blk`
    } else {
      fileName = `HTH_stocks_${new Date().toISOString().split('T')[0]}.blk`
    }

    const blob = new Blob([stockCodes], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导出CSV功能
  const handleExportCSV = () => {
    if (currentFilteredData.length === 0) {
      alert('没有符合条件的股票数据可导出')
      return
    }

    const headers = ['股票代码', '股票名称', '最高价日期', '最低价日期', '跌幅百分比', '成交量比例', '距今天数', '下跌天数']
    const csvContent = [
      headers.join(','),
      ...currentFilteredData.map(stock => [
        stock.stockCode,
        stock.stockName,
        stock.maxPriceDate,
        stock.minPriceDate,
        stock.decreasePercent,
        stock.volumeRatio,
        stock.minPriceDayCount || '',
        stock.downDayCount || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_analysis_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* 标题栏 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">股票数据分析工具</h1>
            <p className="mt-1 text-gray-600">
              使用多种算法分析股票数据，发现投资机会
            </p>
          </div>
          
          {/* 工具栏 */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowUpload(true)}
              className="shadow-sm"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              上传文件
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDatasets(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              {dataSource === 'dataset' && currentDatasetId
                ? datasets.find(d => d.id === currentDatasetId)?.name || '已保存数据集'
                : '我的数据集'
              }
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              算法配置
            </Button>
          </div>
        </div>
      </div>

      {/* 搜索头部 */}
      <SearchHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentFilteredData={currentFilteredData}
        onExportStockCodes={handleExportStockCodes}
        onExportCSV={handleExportCSV}
      />

      {/* 算法标签页 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <AlgorithmTabs
          activeAlgorithm={activeAlgorithm}
          setActiveAlgorithm={setActiveAlgorithm}
          slidingWindowData={slidingWindowData}
          higherThanHistoryData={higherThanHistoryData}
          filteredSlidingWindowData={filteredSlidingWindowData}
          filteredHigherThanHistoryData={filteredHigherThanHistoryData}
          showUpload={showUpload}
          setShowConfig={setShowConfig}
          setShowConfigHistory={setShowConfigHistory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          isAnalyzing={isAnalyzing}
          analyzingAlgorithm={analyzingAlgorithm}
        />
      </div>

      {/* 图表展示 */}
      {currentFilteredData.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">数据分布图</h2>
          <StockChart data={currentFilteredData} />
        </div>
      )}

      {/* 文件上传组件 */}
      <FileUpload
        open={showUpload}
        onFilesProcessed={handleFileProcessComplete}
        onClose={() => setShowUpload(false)}
        onProgressUpdate={(progress, status) => {
          console.log('Progress update received:', progress, status)
          // FileUpload 有自己的进度条，这里的回调主要用于调试
        }}
      />

      {/* 配置面板 */}
      <ConfigPanel
        showConfig={showConfig}
        setShowConfig={setShowConfig}
        showConfigHistory={showConfigHistory}
        setShowConfigHistory={setShowConfigHistory}
        activeAlgorithm={activeAlgorithm}
        tempSlidingWindowConfig={tempSlidingWindowConfig}
        setTempSlidingWindowConfig={setTempSlidingWindowConfig}
        tempHigherThanHistoryConfig={tempHigherThanHistoryConfig}
        setTempHigherThanHistoryConfig={setTempHigherThanHistoryConfig}
        slidingWindowConfigHistory={slidingWindowConfigHistory}
        higherThanHistoryConfigHistory={higherThanHistoryConfigHistory}
        applySlidingWindowConfig={applySlidingWindowConfig}
        applyHigherThanHistoryConfig={applyHigherThanHistoryConfig}
        applyHistoryConfig={applyHistoryConfig}
        updateConfigHistoryTag={updateConfigHistoryTag}
        deleteConfigHistory={deleteConfigHistory}
        isEditingTag={isEditingTag}
        setIsEditingTag={setIsEditingTag}
        currentTagValue={currentTagValue}
        setCurrentTagValue={setCurrentTagValue}
        isAnalyzing={isAnalyzing}
        analyzingAlgorithm={analyzingAlgorithm}
      />

      {/* 数据集管理器 */}
      <DatasetManager
        showDatasets={showDatasets}
        setShowDatasets={setShowDatasets}
        datasets={datasets}
        setDatasets={setDatasets}
        currentDatasetId={currentDatasetId}
        onSelectDataset={handleSelectDataset}
        onDeleteDataset={handleDeleteDataset}
      />
    </div>
  )
}

// 主导出组件，包装了数据提供者
export default function StockDashboard() {
  return (
    <StockDataProvider>
      <StockDashboardContent />
    </StockDataProvider>
  )
}
