'use client'

import { X, Settings, Clock, Tag, Trash2 } from 'lucide-react'
import { StockSearchConfig, HigherThanHistoryConfig, AnalysisAlgorithm, SlidingWindowConfigHistory, HigherThanHistoryConfigHistory } from '@/lib/types'
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
  setCurrentTagValue
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
            <button
              onClick={() => setShowConfigHistory(!showConfigHistory)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="配置历史"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowConfig(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeAlgorithm === AnalysisAlgorithm.SlidingWindow ? (
            <SlidingWindowConfigForm 
              config={tempSlidingWindowConfig}
              setConfig={setTempSlidingWindowConfig}
              onApply={applySlidingWindowConfig}
            />
          ) : (
            <HigherThanHistoryConfigForm 
              config={tempHigherThanHistoryConfig}
              setConfig={setTempHigherThanHistoryConfig}
              onApply={applyHigherThanHistoryConfig}
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
                            <input
                              type="text"
                              value={currentTagValue}
                              onChange={(e) => setCurrentTagValue(e.target.value)}
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateConfigHistoryTag(activeAlgorithm, historyItem.id, currentTagValue)
                                  setIsEditingTag(null)
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                updateConfigHistoryTag(activeAlgorithm, historyItem.id, currentTagValue)
                                setIsEditingTag(null)
                              }}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                            >
                              保存
                            </button>
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
                        <button
                          onClick={() => deleteConfigHistory(activeAlgorithm, historyItem.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="删除配置"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => applyHistoryConfig(activeAlgorithm, historyItem.config)}
                      className="mt-3 w-full py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-sm hover:bg-blue-100 transition-colors"
                    >
                      应用此配置
                    </button>
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
  onApply 
}: { 
  config: StockSearchConfig
  setConfig: (config: StockSearchConfig) => void
  onApply: () => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          滑动窗口大小
        </label>
        <div className="flex items-center">
          <input
            type="number"
            min="3"
            max="15"
            value={config.windowSize}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 3 && value <= 15) {
                setConfig({...config, windowSize: value});
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          <input
            type="number"
            min="50"
            max="1000"
            step="10"
            value={config.searchDays}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 50 && value <= 1000) {
                setConfig({...config, searchDays: value});
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <input
              type="number"
              min="5"
              max="50"
              value={config.minPriceDecreasePercent}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 5 && value <= 50) {
                  setConfig({...config, minPriceDecreasePercent: value});
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="ml-2 text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大跌幅百分比
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="30"
              max="100"
              value={config.maxPriceDecreasePercent}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 30 && value <= 100) {
                  setConfig({...config, maxPriceDecreasePercent: value});
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={config.volumeRatio}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 1 && value <= 10) {
                setConfig({...config, volumeRatio: value});
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="ml-2 text-gray-500">倍</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          成交量相对于前期的比例，默认为4倍（1-10倍）
        </p>
      </div>

      <div className="pt-2 flex justify-between">
        <button
          onClick={() => setConfig({...DEFAULT_STOCK_SEARCH_CONFIG})}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          重置为默认值
        </button>
        <button
          onClick={onApply}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          应用更改
        </button>
      </div>
    </>
  )
}

// 高于历史区间配置表单组件
function HigherThanHistoryConfigForm({ 
  config, 
  setConfig, 
  onApply 
}: { 
  config: HigherThanHistoryConfig
  setConfig: (config: HigherThanHistoryConfig) => void
  onApply: () => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          回看天数
        </label>
        <div className="flex items-center">
          <input
            type="number"
            min="10"
            max="100"
            value={config.lookbackDays}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 10 && value <= 100) {
                setConfig({...config, lookbackDays: value});
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="ml-2 text-gray-500">天</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          回看天数决定了分析历史数据的时间范围，默认为30天（10-100天）
        </p>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          最小超过历史价格百分比
        </label>
        <div className="flex items-center">
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={config.minimumRange}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 0.1 && value <= 10) {
                setConfig({...config, minimumRange: value});
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="ml-2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          超过历史价格的最小百分比，默认为1%（0.1-10%）
        </p>
      </div>
      
      <div className="pt-2 flex justify-between">
        <button
          onClick={() => setConfig({...DEFAULT_HIGHER_THAN_HISTORY_CONFIG})}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          重置为默认值
        </button>
        <button
          onClick={onApply}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          应用更改
        </button>
      </div>
    </>
  )
}
