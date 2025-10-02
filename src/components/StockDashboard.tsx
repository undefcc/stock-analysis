'use client'

import { Calendar, Upload as UploadIcon, Database, Settings, Download } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import StockChart from './StockChart'
import FileUpload from './FileUpload'
import SearchHeader from './SearchHeader'
import AlgorithmTabs from './AlgorithmTabs'
import ConfigPanel from './ConfigPanel'
import DatasetManager from './DatasetManager'
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 处理中状态指示器 */}
      {isProcessing && (
        <div className="fixed top-0 left-0 right-0 flex flex-col items-center justify-center bg-blue-600 text-white py-3 z-40">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">正在处理股票数据...</span>
          </div>
          <div className="mt-2 w-64 bg-blue-700 rounded-full h-2">
            <Progress id="processing-progress" value={0} className="h-2" />
          </div>
          <div id="processing-status" className="mt-1 text-sm opacity-90"></div>
        </div>
      )}

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
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              上传文件
            </button>
            
            <button
              onClick={() => setShowDatasets(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Database className="h-4 w-4 mr-2" />
              {dataSource === 'dataset' && currentDatasetId
                ? datasets.find(d => d.id === currentDatasetId)?.name || '已保存数据集'
                : '我的数据集'
              }
            </button>
            
            <button
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              算法配置
            </button>
          </div>
        </div>
      </div>

      {/* 搜索头部 */}
      <SearchHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
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
      {showUpload && (
        <FileUpload
          onFilesProcessed={handleFileProcessComplete}
          isProcessing={isProcessing}
        />
      )}

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
