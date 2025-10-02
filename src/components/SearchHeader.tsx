'use client'

import { Search, TrendingDown, TrendingUp } from 'lucide-react'
import { StockData } from '@/lib/types'

interface SearchHeaderProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: 'minPriceDate' | 'decreasePercent' | 'volumeRatio' | 'minPriceDayCount' | 'downDayCount'
  setSortBy: (sort: 'minPriceDate' | 'decreasePercent' | 'volumeRatio' | 'minPriceDayCount' | 'downDayCount') => void
  currentFilteredData: StockData[]
  onExportStockCodes: () => void
  onExportCSV: () => void
}

export default function SearchHeader({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  currentFilteredData,
  onExportStockCodes,
  onExportCSV
}: SearchHeaderProps) {
  const stats = {
    totalStocks: currentFilteredData.length,
    avgDecrease: currentFilteredData.length > 0 
      ? (currentFilteredData.reduce((sum, stock) => sum + stock.decreasePercent, 0) / currentFilteredData.length).toFixed(1)
      : '0'
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6 p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索股票代码或名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* 排序选择 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">排序:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="minPriceDate">最低价日期</option>
            <option value="decreasePercent">跌幅百分比</option>
            <option value="volumeRatio">成交量比例</option>
            <option value="minPriceDayCount">距今天数</option>
            <option value="downDayCount">下跌天数</option>
          </select>
        </div>
      </div>
      
      {/* 统计信息和导出按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-gray-600">找到 {stats.totalStocks} 个符合条件的股票</span>
          </div>
          {stats.totalStocks > 0 && (
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">平均跌幅 {stats.avgDecrease}%</span>
            </div>
          )}
        </div>
        
        {/* 导出按钮 */}
        {currentFilteredData.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={onExportStockCodes}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              导出股票代码
            </button>
            <button
              onClick={onExportCSV}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              导出CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
