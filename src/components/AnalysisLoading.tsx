"use client"

import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { AnalysisAlgorithm } from "@/lib/types"

interface AnalysisLoadingProps {
  isAnalyzing: boolean
  analyzingAlgorithm: AnalysisAlgorithm | null
}

export default function AnalysisLoading({ isAnalyzing, analyzingAlgorithm }: AnalysisLoadingProps) {
  if (!isAnalyzing || !analyzingAlgorithm) {
    return null
  }

  const algorithmName = analyzingAlgorithm === AnalysisAlgorithm.SlidingWindow 
    ? "滑动窗口算法" 
    : "高于历史区间算法"

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="flex items-center space-x-3">
          <Spinner size="lg" className="text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              正在分析数据
            </h3>
            <p className="text-sm text-gray-500">
              使用 {algorithmName} 分析中，请稍候...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
