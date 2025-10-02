import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, Save } from 'lucide-react'
import { batchAnalyzeSlidingWindow } from '@/lib/slidingWindowAnalysis'
import { batchAnalyzeMaxDecrease } from '@/lib/maxDecreaseAnalysis'
import { parseStockFile } from '@/lib/stockFileParser'
import { StockFileData, StockAnalysisResult, AnalysisAlgorithm } from '@/lib/types'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  onFilesProcessed: (data: {
    rawData: StockFileData[],
    analysisResults: StockAnalysisResult[]
  }, saveAsDataset?: boolean, datasetName?: string) => void
  isProcessing: boolean
}

export default function FileUpload({ onFilesProcessed, isProcessing }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [datasetName, setDatasetName] = useState('')
  const [saveAsDataset, setSaveAsDataset] = useState(true)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const txtFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.txt')
    )
    setUploadedFiles(txtFiles)

    if (txtFiles.length > 0) {
      try {
        // 显示处理状态提示
        const statusElement = document.getElementById('processing-status')
        const progressElement = document.getElementById('file-upload-progress') as HTMLProgressElement
        
        if (statusElement) {
          statusElement.textContent = '准备解析文件...'
          statusElement.classList.add('animate-pulse')
        }
        
        if (progressElement) {
          progressElement.setAttribute('value', '0')
        }
        
        // 延迟一下，让UI有时间更新
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // 分批解析文件，显示进度
        const { parseStockFileRaw, analyzeStockData } = await import('@/lib/stockFileParser')
        const rawData: any[] = []
        const analysisResults: any[] = []
        
        const totalFiles = txtFiles.length
        
        for (let i = 0; i < totalFiles; i++) {
          const file = txtFiles[i]
          
          if (statusElement) {
            statusElement.textContent = `解析文件 (${i+1}/${totalFiles})...`
          }
          
          if (progressElement) {
            // 文件解析阶段：0%-50%
            const parseProgress = Math.floor((i / totalFiles) * 50)
            progressElement.setAttribute('value', parseProgress.toString())
          }
          
          const rawStockData = await parseStockFileRaw(file)
          if (rawStockData) {
            rawData.push(rawStockData)
            
            // 使用原始数据进行分析
            const analysisResult = analyzeStockData(rawStockData)
            if (analysisResult) {
              analysisResults.push(analysisResult)
            }
          }
          
          // 让UI有机会更新
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        if (statusElement) {
          statusElement.textContent = '处理分析结果...'
        }
        
        if (progressElement) {
          progressElement.setAttribute('value', '50')
        }
        
        // 自动生成数据集名称建议
        if (!datasetName) {
          const defaultName = `数据集 (${txtFiles.length}个文件) ${new Date().toLocaleDateString('zh-CN')}`
          setDatasetName(defaultName)
        }
        
        // 进行结果处理
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (statusElement) {
          statusElement.textContent = saveAsDataset ? '准备保存数据集...' : '准备完成分析...'
        }
        
        if (progressElement) {
          progressElement.setAttribute('value', '75')
        }
        
        const results = {
          rawData: rawData,
          analysisResults: analysisResults
        }
        
        if (progressElement) {
          progressElement.setAttribute('value', '100')
        }
        
        // 给用户一个短暂的时间看到100%完成状态
        await new Promise(resolve => setTimeout(resolve, 300))
        
        onFilesProcessed(results, saveAsDataset, datasetName || undefined)
      } catch (error) {
        console.error('处理文件失败:', error)
        
        const statusElement = document.getElementById('processing-status')
        const progressElement = document.getElementById('file-upload-progress') as HTMLProgressElement
        
        if (statusElement) {
          statusElement.textContent = `处理出错: ${error instanceof Error ? error.message : '未知错误'}`
          statusElement.classList.add('bg-red-50', 'text-red-600')
          statusElement.classList.remove('animate-pulse')
        }
        
        if (progressElement) {
          progressElement.setAttribute('value', '0')
        }
        
        // 5秒后清除错误信息
        setTimeout(() => {
          if (statusElement) {
            statusElement.textContent = ''
            statusElement.classList.remove('bg-red-50', 'text-red-600')
            statusElement.classList.add('animate-pulse')
          }
        }, 5000)
        
        alert('处理文件时发生错误，请检查文件格式')
      }
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    if (newFiles.length === 0) {
      onFilesProcessed({ rawData: [], analysisResults: [] })
    }
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".txt"
          onChange={handleChange}
          disabled={isProcessing}
        />

        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-12 w-12" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isProcessing ? '正在处理文件...' : '上传股票数据文件'}
            </p>
            {isProcessing ? (
              <div className="text-sm text-blue-600 mt-1 font-medium">
                <span id="processing-status">解析数据中...</span>
                <div className="mt-2 w-full">
                  <Progress id="file-upload-progress" value={0} className="h-1.5" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                拖拽文件到此处或点击选择文件 (支持 .txt 格式)
              </p>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={onButtonClick}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            选择文件
          </button>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            已上传文件 ({uploadedFiles.length} 个)
          </h4>
          
          {/* 数据集设置 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <input
                id="save-as-dataset"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={saveAsDataset}
                onChange={(e) => setSaveAsDataset(e.target.checked)}
                disabled={isProcessing}
              />
              <label htmlFor="save-as-dataset" className="ml-2 text-sm text-gray-700">
                保存为数据集以便将来快速访问
              </label>
            </div>
            
            {saveAsDataset && (
              <div className="mt-2">
                <label htmlFor="dataset-name" className="block text-sm font-medium text-gray-700">
                  数据集名称
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="dataset-name"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="输入数据集名称"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  给您的数据集起一个有意义的名称，便于将来识别
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 mb-2">文件格式说明:</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 支持批量上传 .txt 格式的股票历史数据文件</li>
          <li>• 文件格式: 股票代码 股票名称 (第一行)</li>
          <li>• 数据格式: 日期 开盘价 最高价 最低价 收盘价 成交量 成交额</li>
          <li>• 例如: 01/03/2020 3.30 3.30 3.30 3.30 667000 2001000.00</li>
        </ul>
      </div>
    </div>
  )
}
