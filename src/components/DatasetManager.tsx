'use client'

import { useState, useEffect } from 'react'
import { Database, Trash2, X } from 'lucide-react'
import { getDatasets, deleteDataset } from '@/lib/indexedDB'

interface DatasetInfo {
  id: string;
  name: string;
  date: string;
  count: number;
}

interface DatasetManagerProps {
  showDatasets: boolean
  setShowDatasets: (show: boolean) => void
  datasets: DatasetInfo[]
  setDatasets: (datasets: DatasetInfo[]) => void
  currentDatasetId: string
  onSelectDataset: (datasetId: string) => void
  onDeleteDataset: (datasetId: string) => void
}

export default function DatasetManager({
  showDatasets,
  setShowDatasets,
  datasets,
  setDatasets,
  currentDatasetId,
  onSelectDataset,
  onDeleteDataset
}: DatasetManagerProps) {
  const [loading, setLoading] = useState(false)

  // 加载数据集列表
  const loadDatasets = async () => {
    setLoading(true)
    try {
      const datasetList = await getDatasets()
      setDatasets(datasetList)
    } catch (error) {
      console.error('加载数据集失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showDatasets) {
      loadDatasets()
    }
  }, [showDatasets])

  if (!showDatasets) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              {datasets.length > 0 ? '我的数据集' : '无保存的数据集'}
            </h3>
          </div>
          <button
            onClick={() => setShowDatasets(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无保存的数据集</h3>
              <p className="mt-1 text-sm text-gray-500">
                上传股票数据文件时选择"保存为数据集"即可创建数据集
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                    currentDatasetId === dataset.id ? 'bg-blue-50' : ''
                  } hover:bg-gray-50`}
                  onClick={() => onSelectDataset(dataset.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{dataset.name}</h4>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>创建时间: {dataset.date}</span>
                        <span>股票数量: {dataset.count}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteDataset(dataset.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="删除数据集"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {currentDatasetId === dataset.id && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ✓ 当前选中
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
