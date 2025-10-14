'use client'

import { Search, TrendingDown, TrendingUp } from 'lucide-react'
import { StockData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchHeaderProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  currentFilteredData: StockData[]
  onExportStockCodes: () => void
  onExportCSV: () => void
}

export default function SearchHeader({
  searchTerm,
  setSearchTerm,
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索股票代码或名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
            <Button
              variant="outline"
              size="sm"
              onClick={onExportStockCodes}
            >
              导出股票代码
            </Button>
            <Button
              size="sm"
              onClick={onExportCSV}
            >
              导出CSV
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
