'use client'

import { X, Settings, Clock, Tag, Trash2, Loader2 } from 'lucide-react'
import { StockSearchConfig, HigherThanHistoryConfig, AnalysisAlgorithm, SlidingWindowConfigHistory, HigherThanHistoryConfigHistory } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEFAULT_STOCK_SEARCH_CONFIG } from '@/lib/slidingWindowAnalysis'
import { DEFAULT_HIGHER_THAN_HISTORY_CONFIG } from '@/lib/algorithms/higherThanHistory'

interface ConfigPanelProps {
  showConfig: boolean
  setShowConfig: (show: boolean) => void
  showConfigHistory: boolean
  setShowConfigHistory: (show: boolean) => void
  activeAlgorithm: AnalysisAlgorithm
  tempSlidingWindowConfig: StockSearchConfig
  setTempSlidingWindowConfig: (config: StockSearchConfig) => void
  tempHigherThanHistoryConfig: HigherThanHistoryConfig
  setTempHigherThanHistoryConfig: (config: HigherThanHistoryConfig) => void
  slidingWindowConfigHistory: SlidingWindowConfigHistory[]
  higherThanHistoryConfigHistory: HigherThanHistoryConfigHistory[]
  applySlidingWindowConfig: () => void
  applyHigherThanHistoryConfig: () => void
  applyHistoryConfig: (algorithm: AnalysisAlgorithm, config: StockSearchConfig | HigherThanHistoryConfig) => void
  updateConfigHistoryTag: (algorithm: AnalysisAlgorithm, configId: string, newTag: string) => void
  deleteConfigHistory: (algorithm: AnalysisAlgorithm, configId: string) => void
  isEditingTag: string | null
  setIsEditingTag: (id: string | null) => void
  currentTagValue: string
  setCurrentTagValue: (value: string) => void
  isAnalyzing: boolean
  analyzingAlgorithm: AnalysisAlgorithm | null
}

export default function ConfigPanel({
  showConfig,
  setShowConfig,
  showConfigHistory,
  setShowConfigHistory,
  activeAlgorithm,
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
  isAnalyzing,
  analyzingAlgorithm
}: ConfigPanelProps) {
  const currentHistory = activeAlgorithm === AnalysisAlgorithm.SlidingWindow 
    ? slidingWindowConfigHistory 
    : higherThanHistoryConfigHistory

  if (!showConfig) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              {activeAlgorithm === AnalysisAlgorithm.SlidingWindow ? '滑动窗口搜索配置' : '高于历史区间搜索配置'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfigHistory(!showConfigHistory)}
              title="配置历史"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeAlgorithm === AnalysisAlgorithm.SlidingWindow ? (
            <SlidingWindowConfigForm 
              config={tempSlidingWindowConfig}
              setConfig={setTempSlidingWindowConfig}
              onApply={applySlidingWindowConfig}
              isAnalyzing={isAnalyzing}
              analyzingAlgorithm={analyzingAlgorithm}
              currentAlgorithm={activeAlgorithm}
            />
          ) : (
            <HigherThanHistoryConfigForm 
              config={tempHigherThanHistoryConfig}
              setConfig={setTempHigherThanHistoryConfig}
              onApply={applyHigherThanHistoryConfig}
              isAnalyzing={isAnalyzing}
              analyzingAlgorithm={analyzingAlgorithm}
              currentAlgorithm={activeAlgorithm}
            />
          )}
        </div>

        {/* 配置历史面板 */}
        {showConfigHistory && (
          <div className="border-t">
            <div className="p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                配置历史记录
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentHistory.map((historyItem) => (
                  <div key={historyItem.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isEditingTag === historyItem.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              value={currentTagValue}
                              onChange={(e) => setCurrentTagValue(e.target.value)}
                              className="flex-1 text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateConfigHistoryTag(activeAlgorithm, historyItem.id, currentTagValue)
                                  setIsEditingTag(null)
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                updateConfigHistoryTag(activeAlgorithm, historyItem.id, currentTagValue)
                                setIsEditingTag(null)
                              }}
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setIsEditingTag(historyItem.id)
                              setCurrentTagValue(historyItem.tag)
                            }}
                            className="cursor-pointer flex items-center"
                          >
                            <Tag className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-sm font-medium">{historyItem.tag}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(historyItem.timestamp).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConfigHistory(activeAlgorithm, historyItem.id)}
                          title="删除配置"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistoryConfig(activeAlgorithm, historyItem.config)}
                      className="mt-3 w-full"
                    >
                      应用此配置
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 滑动窗口配置表单组件
function SlidingWindowConfigForm({ 
  config, 
  setConfig, 
  onApply,
  isAnalyzing,
  analyzingAlgorithm,
  currentAlgorithm
}: { 
  config: StockSearchConfig
  setConfig: (config: StockSearchConfig) => void
  onApply: () => void
  isAnalyzing: boolean
  analyzingAlgorithm: AnalysisAlgorithm | null
  currentAlgorithm: AnalysisAlgorithm
}) {
  const isCurrentAlgorithmAnalyzing = isAnalyzing && analyzingAlgorithm === currentAlgorithm;
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          滑动窗口大小
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={3}
            max={15}
            value={config.windowSize}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 3 && value <= 15) {
                setConfig({...config, windowSize: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">天</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          滑动窗口的大小决定了分析的时间范围，默认为6天（3-15天）
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          搜索天数
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={50}
            max={1000}
            step={10}
            value={config.searchDays}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 50 && value <= 1000) {
                setConfig({...config, searchDays: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">天</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          向前搜索的最大天数，默认为250天（50-1000天）
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最小跌幅百分比
          </label>
          <div className="flex items-center">
            <Input
              type="number"
              min={5}
              max={50}
              value={config.minPriceDecreasePercent}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 5 && value <= 50) {
                  setConfig({...config, minPriceDecreasePercent: value});
                }
              }}
            />
            <span className="ml-2 text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大跌幅百分比
          </label>
          <div className="flex items-center">
            <Input
              type="number"
              min={30}
              max={100}
              value={config.maxPriceDecreasePercent}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 30 && value <= 100) {
                  setConfig({...config, maxPriceDecreasePercent: value});
                }
              }}
            />
            <span className="ml-2 text-gray-500">%</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          成交量比例
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={config.volumeRatio}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 1 && value <= 10) {
                setConfig({...config, volumeRatio: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">倍</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          成交量相对于前期的比例，默认为4倍（1-10倍）
        </p>
      </div>

      <div className="pt-2 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setConfig({...DEFAULT_STOCK_SEARCH_CONFIG})}
          disabled={isCurrentAlgorithmAnalyzing}
        >
          重置为默认值
        </Button>
        <Button
          onClick={onApply}
          disabled={isCurrentAlgorithmAnalyzing}
        >
          {isCurrentAlgorithmAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          应用更改
        </Button>
      </div>
    </>
  )
}

// 高于历史区间配置表单组件
function HigherThanHistoryConfigForm({ 
  config, 
  setConfig, 
  onApply,
  isAnalyzing,
  analyzingAlgorithm,
  currentAlgorithm
}: { 
  config: HigherThanHistoryConfig
  setConfig: (config: HigherThanHistoryConfig) => void
  onApply: () => void
  isAnalyzing: boolean
  analyzingAlgorithm: AnalysisAlgorithm | null
  currentAlgorithm: AnalysisAlgorithm
}) {
  const isCurrentAlgorithmAnalyzing = isAnalyzing && analyzingAlgorithm === currentAlgorithm;
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          回看天数
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={1}
            value={config.lookbackDays}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);
              if (value >= 1) {
                setConfig({...config, lookbackDays: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">天</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          回看天数决定了分析历史数据的时间范围，默认为10天（最小1天）
        </p>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          最小超过历史价格百分比
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={config.minimumRange}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 0.1 && value <= 10) {
                setConfig({...config, minimumRange: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          超过历史价格的最小百分比，默认为1%（0.1-10%）
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          最高最低价差值百分比限制
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={1}
            max={100}
            value={config.maxPriceRangePercent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseFloat(e.target.value);
              if (value >= 1 && value <= 100) {
                setConfig({...config, maxPriceRangePercent: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          控制所选时间范围内最高价与最低价的差值不超过此百分比，默认为20%（可编辑）
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          指定日期偏移
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={0}
            max={30}
            value={config.targetDateIndex || 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);
              if (value >= 0 && value <= 30) {
                setConfig({...config, targetDateIndex: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">天前</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          指定分析日期（0表示当天，1表示前1天，默认为0）
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          与20日均线相差百分比
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={config.ma20DiffPercent}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 0) {
                setConfig({...config, ma20DiffPercent: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          指定日期的价格与20日均线相差的最大百分比，默认为2%（最小0%）
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          20日均线连续高于历史天数
        </label>
        <div className="flex items-center">
          <Input
            type="number"
            min={1}
            max={10}
            value={config.ma20ConsecutiveDays}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 10) {
                setConfig({...config, ma20ConsecutiveDays: value});
              }
            }}
          />
          <span className="ml-2 text-gray-500">天</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          指定日期前N天每天的20日均线都高于历史价格，默认为5天（1-10天）
        </p>
      </div>
      
      <div className="pt-2 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setConfig({ ...DEFAULT_HIGHER_THAN_HISTORY_CONFIG })}
          disabled={isCurrentAlgorithmAnalyzing}
        >
          重置为默认值
        </Button>
        <Button
          onClick={onApply}
          disabled={isCurrentAlgorithmAnalyzing}
        >
          {isCurrentAlgorithmAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          应用更改
        </Button>
      </div>
    </>
  )
}
