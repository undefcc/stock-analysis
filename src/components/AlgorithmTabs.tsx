'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3 } from 'lucide-react'
import StockTable from './StockTable'
import { StockData, AnalysisAlgorithm } from '@/lib/types'

interface AlgorithmTabsProps {
  activeAlgorithm: AnalysisAlgorithm
  setActiveAlgorithm: (algorithm: AnalysisAlgorithm) => void
  slidingWindowData: StockData[]
  higherThanHistoryData: StockData[]
  filteredSlidingWindowData: StockData[]
  filteredHigherThanHistoryData: StockData[]
  showUpload: boolean
  setShowConfig: (show: boolean) => void
  setShowConfigHistory: (show: boolean) => void
}

export default function AlgorithmTabs({
  activeAlgorithm,
  setActiveAlgorithm,
  slidingWindowData,
  higherThanHistoryData,
  filteredSlidingWindowData,
  filteredHigherThanHistoryData,
  showUpload,
  setShowConfig,
  setShowConfigHistory
}: AlgorithmTabsProps) {
  return (
    <div className="p-2">
      <Tabs 
        defaultValue={AnalysisAlgorithm.SlidingWindow} 
        value={activeAlgorithm} 
        onValueChange={(value) => {
          setActiveAlgorithm(value as AnalysisAlgorithm);
          // 切换算法时关闭配置相关面板
          setShowConfig(false);
          setShowConfigHistory(false);
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value={AnalysisAlgorithm.SlidingWindow}>滑动窗口算法</TabsTrigger>
          <TabsTrigger value={AnalysisAlgorithm.HigherThanHistory}>高于历史区间算法</TabsTrigger>
        </TabsList>
        
        <TabsContent value={AnalysisAlgorithm.SlidingWindow}>
          {slidingWindowData.length > 0 ? (
            <StockTable data={filteredSlidingWindowData} />
          ) : (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
              <p className="mt-1 text-sm text-gray-500">
                {showUpload ? '请上传股票数据文件' : '点击上方的"上传文件"按钮添加数据'}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value={AnalysisAlgorithm.HigherThanHistory}>
          {higherThanHistoryData.length > 0 ? (
            <StockTable data={filteredHigherThanHistoryData} />
          ) : (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
              <p className="mt-1 text-sm text-gray-500">
                {showUpload ? '请上传股票数据文件' : '点击上方的"上传文件"按钮添加数据'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
