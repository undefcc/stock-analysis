import { StockFileData, DayRecord, StockAnalysisResult, StockData } from './types'

// 解析单个股票文件内容
export function parseStockFile(file: File): Promise<StockData | null> {
  return new Promise((resolve) => {
    // 创建一个文件阅读器
    const reader = new FileReader()
    
    // 当文件读取完成时执行
    reader.onload = async (e) => {
      try {
        // 尝试多种编码格式读取文件
        const result = await tryParseWithDifferentEncodings(file)
        resolve(result)
      } catch (error) {
        console.error('Error parsing file:', file.name, error)
        resolve(null)
      }
    }
    
    // 如果读取出错
    reader.onerror = () => {
      console.error('Error reading file:', file.name)
      resolve(null)
    }
    
    // 先尝试以ArrayBuffer形式读取，以便后续尝试不同编码
    reader.readAsArrayBuffer(file)
  })
}

// 尝试用不同编码格式解析文件
async function tryParseWithDifferentEncodings(file: File): Promise<StockData | null> {
  // 读取文件为ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  
  // 尝试的编码列表，优先顺序从高到低
  const encodings = ['UTF-8', 'GB18030', 'GBK', 'GB2312', 'BIG5']
  
  // 依次尝试不同编码
  for (const encoding of encodings) {
    try {
      // 使用特定编码解码文件内容
      const decoder = new TextDecoder(encoding, { fatal: false })
      let content = decoder.decode(arrayBuffer)
      
      // 移除BOM标记
      content = content.replace(/^\uFEFF/, '')
      
      // 检查解码是否正确（是否包含乱码）
      if (!content.includes('�') && content.match(/[\u4e00-\u9fa5]+/)) {
        // 如果没有乱码且包含中文字符，尝试解析
        const stockData = parseStockContent(content, file.name)
        if (stockData) {
          console.log(`成功使用 ${encoding} 编码解析文件: ${file.name}`)
          return stockData
        }
      }
    } catch (e) {
      console.warn(`使用 ${encoding} 解析失败:`, e)
      // 继续尝试下一种编码
    }
  }
  
  // 如果所有编码都失败，尝试直接解析原始文本
  try {
    const textContent = await file.text()
    return parseStockContent(textContent, file.name)
  } catch (e) {
    console.error('所有编码方式均解析失败:', file.name, e)
    return null
  }
}

// 分析股票数据，计算最高价、最低价日期和跌幅
export function analyzeStockData(stockData: StockFileData): StockAnalysisResult | null {
  try {
    const { stockCode, stockName, dayRecords } = stockData
    
    if (dayRecords.length < 2) {
      return null
    }

    // 先按日期排序（从早到晚）
    const sortedRecords = [...dayRecords].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 查找最高价和最低价
    let maxPrice = -1
    let minPrice = Infinity
    let maxPriceDate = ''
    let minPriceDate = ''
    let maxPriceVolume = 0
    let minPriceVolume = 0
    let maxPriceIndex = -1
    let minPriceIndex = -1

    sortedRecords.forEach((record, index) => {
      if (record.highPrice > maxPrice) {
        maxPrice = record.highPrice
        maxPriceDate = record.date
        maxPriceVolume = record.volume
        maxPriceIndex = index
      }
      if (record.lowPrice < minPrice) {
        minPrice = record.lowPrice
        minPriceDate = record.date
        minPriceVolume = record.volume
        minPriceIndex = index
      }
    })

    // 计算最低价距今的天数（参考C++代码中的minPriceDayCount）
    const minPriceDayCount = sortedRecords.length - 1 - minPriceIndex;
    
    // 计算从最高价到最低价的天数（参考C++代码中的downDayCount）
    // 如果最低价在最高价之后，则计算天数差，否则为0
    const downDayCount = minPriceIndex > maxPriceIndex 
      ? minPriceIndex - maxPriceIndex 
      : 0;

    // 计算跌幅百分比
    const decreasePercent = maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0
    
    // 计算成交量比例
    const avgVolume = sortedRecords.reduce((sum, record) => sum + record.volume, 0) / sortedRecords.length
    const volumeRatio = avgVolume > 0 ? Math.round(maxPriceVolume / avgVolume) : 1

    return {
      stockCode,
      stockName,
      maxPriceDate: formatDate(maxPriceDate),
      minPriceDate: formatDate(minPriceDate),
      decreasePercent,
      volumeRatio,
      minPriceDayCount,
      downDayCount
    }
  } catch (error) {
    console.error('分析股票数据失败:', error)
    return null
  }
}

// 格式化日期为YYYY-MM-DD格式
function formatDate(dateStr: string): string {
  try {
    // 处理MM/DD/YYYY格式
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        const year = parts[2]
        return `${year}-${month}-${day}`
      }
    }
    
    // 处理其他格式，尝试创建Date对象
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    return dateStr
  } catch (error) {
    return dateStr
  }
}

// 从文件内容中解析股票数据
function parseStockContent(content: string, fileName: string): StockData | null {
  try {
    // 按行分割内容
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null // 至少需要标题行和一行数据
    
    // 提取股票代码和名称
    const stockCode = extractStockCode(fileName)
    const stockName = extractStockName(lines[0]) || stockCode
    
    // 存储每日数据
    const dayRecords: DayRecord[] = []
    
    // 跳过标题行，解析每一行数据
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#') || line.includes('数据来源')) continue
      
      // 按空格分割每行数据
      const parts = line.split(/\s+/)
      if (parts.length >= 6) { // 至少需要日期和OHLCV数据
        try {
          const record: DayRecord = {
            date: parts[0],
            openPrice: parseFloat(parts[1]),
            highPrice: parseFloat(parts[2]),
            lowPrice: parseFloat(parts[3]),
            closePrice: parseFloat(parts[4]),
            volume: parseFloat(parts[5]),
            amount: parts.length >= 7 ? parseFloat(parts[6]) : 0
          }
          
          // 验证数据有效性
          if (!isNaN(record.openPrice) && 
              !isNaN(record.highPrice) && 
              !isNaN(record.lowPrice) && 
              !isNaN(record.closePrice) && 
              !isNaN(record.volume)) {
            dayRecords.push(record)
          }
        } catch (error) {
          console.warn(`解析第${i}行出错:`, line, error)
        }
      }
    }
    
    // 检查是否有足够的数据
    if (dayRecords.length < 10) {
      console.warn(`股票 ${stockCode} 数据不足，仅有 ${dayRecords.length} 条记录`)
      return null
    }
    
    const stockFileData: StockFileData = {
      stockCode,
      stockName,
      dayRecords
    }
    
    return analyzeStockData(stockFileData)
  } catch (error) {
    console.error('解析股票数据出错:', error)
    return null
  }
}

// 从文件名提取股票代码
function extractStockCode(fileName: string): string {
  // 尝试从文件名中提取6位数字代码
  const match = fileName.match(/[A-Za-z#]*(\d{6})/)
  return match ? match[1] : fileName.replace(/\.(txt|TXT)$/, '')
}

// 从第一行提取股票名称
function extractStockName(firstLine: string): string | null {
  // 尝试从第一行中提取中文名称
  const chineseMatch = firstLine.match(/[\u4e00-\u9fa5]+/)
  return chineseMatch ? chineseMatch[0] : null
}

// 解析单个文件并获取原始数据
export async function parseStockFileRaw(file: File): Promise<StockFileData | null> {
  try {
    // 读取文件为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // 尝试的编码列表，优先顺序从高到低
    const encodings = ['UTF-8', 'GB18030', 'GBK', 'GB2312', 'BIG5']
    
    // 依次尝试不同编码
    for (const encoding of encodings) {
      try {
        // 使用特定编码解码文件内容
        const decoder = new TextDecoder(encoding, { fatal: false })
        let content = decoder.decode(arrayBuffer)
        
        // 移除BOM标记
        content = content.replace(/^\uFEFF/, '')
        
        // 检查解码是否正确（是否包含乱码）
        if (!content.includes('�') && content.match(/[\u4e00-\u9fa5]+/)) {
          // 如果没有乱码且包含中文字符，尝试解析原始数据
          return parseRawStockContent(content, file.name)
        }
      } catch (e) {
        // 继续尝试下一种编码
      }
    }
    
    // 如果所有编码都失败，尝试直接解析原始文本
    const textContent = await file.text()
    return parseRawStockContent(textContent, file.name)
  } catch (error) {
    console.error('处理文件失败:', file.name, error)
    return null
  }
}

// 从文件内容中解析原始股票数据，不进行分析
function parseRawStockContent(content: string, fileName: string): StockFileData | null {
  try {
    // 按行分割内容
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null // 至少需要标题行和一行数据
    
    // 提取股票代码和名称
    const stockCode = extractStockCode(fileName)
    const stockName = extractStockName(lines[0]) || stockCode
    
    // 存储每日数据
    const dayRecords: DayRecord[] = []
    
    // 跳过标题行，解析每一行数据
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#') || line.includes('数据来源')) continue
      
      // 按空格分割每行数据
      const parts = line.split(/\s+/)
      if (parts.length >= 6) { // 至少需要日期和OHLCV数据
        try {
          const record: DayRecord = {
            date: parts[0],
            openPrice: parseFloat(parts[1]),
            highPrice: parseFloat(parts[2]),
            lowPrice: parseFloat(parts[3]),
            closePrice: parseFloat(parts[4]),
            volume: parseFloat(parts[5]),
            amount: parts.length >= 7 ? parseFloat(parts[6]) : 0
          }
          
          // 验证数据有效性
          if (!isNaN(record.openPrice) && 
              !isNaN(record.highPrice) && 
              !isNaN(record.lowPrice) && 
              !isNaN(record.closePrice) && 
              !isNaN(record.volume)) {
            dayRecords.push(record)
          }
        } catch (error) {
          console.warn(`解析第${i}行出错:`, line, error)
        }
      }
    }
    
    // 确保日期按时间顺序排序（从早到晚）
    dayRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // 检查是否有足够的数据
    if (dayRecords.length < 10) {
      console.warn(`股票 ${stockCode} 数据不足，仅有 ${dayRecords.length} 条记录`)
      return null
    }
    
    return {
      stockCode,
      stockName,
      dayRecords
    }
  } catch (error) {
    console.error('解析股票数据出错:', error)
    return null
  }
}

// 批量处理文件
export async function processStockFiles(files: FileList): Promise<{
  rawData: StockFileData[],
  analysisResults: StockAnalysisResult[]
}> {
  const rawData: StockFileData[] = []
  const analysisResults: StockAnalysisResult[] = []
  const promises: Promise<void>[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.name.endsWith('.txt') || file.name.endsWith('.TXT')) {
      promises.push(
        parseStockFileRaw(file).then(rawStockData => {
          if (rawStockData) {
            rawData.push(rawStockData)
            
            // 使用原始数据进行分析
            const analysisResult = analyzeStockData(rawStockData)
            if (analysisResult) {
              analysisResults.push(analysisResult)
            }
          }
        }).catch(error => {
          console.error(`处理文件 ${file.name} 失败:`, error)
        })
      )
    }
  }

  await Promise.all(promises)
  
  // 按最低价日期排序（从最近到最早）
  return {
    rawData,
    analysisResults: analysisResults.sort((a, b) => new Date(b.minPriceDate).getTime() - new Date(a.minPriceDate).getTime())
  }
}
