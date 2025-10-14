import { useRef, useState, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { StockFileData, StockAnalysisResult } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface FileUploadProps {
  onFilesProcessed: (data: {
    rawData: StockFileData[],
    analysisResults: StockAnalysisResult[]
  }, saveAsDataset?: boolean, datasetName?: string) => void
  onClose: () => void
  open: boolean
  onProgressUpdate?: (progress: number, status: string) => void
}

export default function FileUpload({ 
  onFilesProcessed, 
  onClose, 
  open, 
  onProgressUpdate
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [datasetName, setDatasetName] = useState('')
  const [saveAsDataset, setSaveAsDataset] = useState(true)
  
  // FileUpload 组件内部的进度状态
  const [internalProgress, setInternalProgress] = useState(0)
  const [internalStatus, setInternalStatus] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // 当对话框关闭时重置进度状态
  useEffect(() => {
    if (!open) {
      setInternalProgress(0)
      setInternalStatus('')
      setIsProcessing(false)
    }
  }, [open])

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
        setIsProcessing(true)
        // 更新进度状态
        setInternalProgress(0)
        setInternalStatus('准备解析文件...')
        onProgressUpdate?.(0, '准备解析文件...')
        
        // 分批解析文件，显示进度
        const { parseStockFileRaw, analyzeStockData } = await import('@/lib/stockFileParser')
        const rawData: any[] = []
        const analysisResults: any[] = []
        
        const totalFiles = txtFiles.length
        
        for (let i = 0; i < totalFiles; i++) {
          const file = txtFiles[i]
          
          // 优化进度更新：只在处理较多文件时，或每5个文件更新一次
          const shouldUpdateProgress = totalFiles <= 5 || i % Math.max(1, Math.floor(totalFiles / 5)) === 0
          if (shouldUpdateProgress) {
            const progress = Math.floor((i / totalFiles) * 50)
            const statusText = `解析文件 (${i+1}/${totalFiles})...`
            setInternalProgress(progress)
            setInternalStatus(statusText)
            onProgressUpdate?.(progress, statusText)
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
        }
        
        setInternalProgress(50)
        setInternalStatus('处理分析结果...')
        onProgressUpdate?.(50, '处理分析结果...')
        console.log('FileUpload: Called onProgressUpdate with 50%')
        
        // 自动生成数据集名称建议
        if (!datasetName) {
          const defaultName = `数据集 (${txtFiles.length}个文件) ${new Date().toLocaleDateString('zh-CN')}`
          setDatasetName(defaultName)
        }
        
        // 进行结果处理
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const finalStatusText = saveAsDataset ? '准备保存数据集...' : '准备完成分析...'
        setInternalProgress(75)
        setInternalStatus(finalStatusText)
        onProgressUpdate?.(75, finalStatusText)
        
        const results = {
          rawData: rawData,
          analysisResults: analysisResults
        }
        
        setInternalProgress(100)
        setInternalStatus('处理完成')
        onProgressUpdate?.(100, '处理完成')
        console.log('FileUpload: Called onProgressUpdate with 100%')
        
        // 给用户一个短暂的时间看到100%完成状态
        await new Promise(resolve => setTimeout(resolve, 300))
        
        onFilesProcessed(results, saveAsDataset, datasetName || undefined)
      } catch (error) {
        console.error('处理文件失败:', error)
        
        const errorMessage = `处理出错: ${error instanceof Error ? error.message : '未知错误'}`
        setInternalProgress(0)
        setInternalStatus(errorMessage)
        onProgressUpdate?.(0, errorMessage)
        
        // 5秒后清除错误信息
        setTimeout(() => {
          setInternalProgress(0)
          setInternalStatus('')
          onProgressUpdate?.(0, '')
        }, 5000)
        
        alert('处理文件时发生错误，请检查文件格式')
      } finally {
        setIsProcessing(false)
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>上传股票数据文件</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
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
                  <div className="mx-auto h-12 w-12 text-muted-foreground">
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    ) : (
                      <Upload className="h-12 w-12" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">
                      {isProcessing ? '正在处理文件...' : '上传股票数据文件'}
                    </h3>
                    {isProcessing ? (
                      <div className="text-sm text-primary mt-2 space-y-2">
                        <div className="font-medium">
                          {internalStatus || '解析数据中...'}
                        </div>
                        <div className="space-y-1">
                          <Progress value={internalProgress} className="h-2" />
                          <div className="text-xs text-muted-foreground text-center">
                            {internalProgress}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        拖拽文件到此处或点击选择文件 (支持 .txt 格式)
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={onButtonClick}
                    disabled={isProcessing}
                    className="mt-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  已上传文件 ({uploadedFiles.length} 个)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dataset Settings */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-as-dataset"
                        checked={saveAsDataset}
                        onCheckedChange={(checked) => setSaveAsDataset(checked === true)}
                        disabled={isProcessing}
                      />
                      <Label htmlFor="save-as-dataset" className="text-sm">
                        保存为数据集以便将来快速访问
                      </Label>
                    </div>
                    
                    {saveAsDataset && (
                      <div className="space-y-2">
                        <Label htmlFor="dataset-name">数据集名称</Label>
                        <Input
                          id="dataset-name"
                          placeholder="输入数据集名称"
                          value={datasetName}
                          onChange={(e) => setDatasetName(e.target.value)}
                          disabled={isProcessing}
                        />
                        <p className="text-xs text-muted-foreground">
                          给您的数据集起一个有意义的名称，便于将来识别
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">文件格式说明</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 支持批量上传 .txt 格式的股票历史数据文件</li>
                <li>• 文件格式: 股票代码 股票名称 (第一行)</li>
                <li>• 数据格式: 日期 开盘价 最高价 最低价 收盘价 成交量 成交额</li>
                <li>• 例如: 01/03/2020 3.30 3.30 3.30 3.30 667000 2001000.00</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
