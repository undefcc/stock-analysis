#include "StockSearchTool.h"
#include <chrono>
#include <iomanip>
#include <regex>

namespace StockSearch {

// 辅助函数：获取当前时间字符串
std::string getCurrentTimeString() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

/**
 * StockSearchTool 实现
 */
StockSearchTool::StockSearchTool() 
    : processedStockCount_(0), foundStockCount_(0), isInitialized_(false) {
    logger_ = std::make_unique<Logger>();
    dataReader_ = std::make_unique<StockDataReader>(logger_.get());
    analyzer_ = std::make_unique<StockAnalyzer>(logger_.get());
    searchAlgo_ = std::make_unique<SearchAlgorithm>(logger_.get());
    resultWriter_ = std::make_unique<ResultWriter>(logger_.get());
}

StockSearchTool::~StockSearchTool() = default;

bool StockSearchTool::initialize(const std::string& inputDir, 
                                const std::string& outputDir,
                                const std::string& resultDir) {
    logger_->info("初始化股票搜索工具...");
    
    inputDir_ = inputDir;
    outputDir_ = outputDir;
    resultDir_ = resultDir;
    
    // 创建必要的目录
    if (!Utils::createDirectoryIfNotExists(outputDir_)) {
        logger_->error("无法创建输出目录: " + outputDir_);
        return false;
    }
    
    if (!Utils::createDirectoryIfNotExists(resultDir_)) {
        logger_->error("无法创建结果目录: " + resultDir_);
        return false;
    }
    
    // 设置各个组件
    if (!dataReader_->setInputDirectory(inputDir_)) {
        logger_->error("设置输入目录失败: " + inputDir_);
        return false;
    }
    
    if (!resultWriter_->setOutputDirectory(resultDir_)) {
        logger_->error("设置输出目录失败: " + resultDir_);
        return false;
    }
    
    // 设置日志文件
    std::string logFile = resultDir_ + "/stock_search.log";
    logger_->setLogFile(logFile);
    
    isInitialized_ = true;
    logger_->info("股票搜索工具初始化完成");
    return true;
}

bool StockSearchTool::processAllStocks() {
    if (!isInitialized_) {
        logger_->error("工具未初始化");
        return false;
    }
    
    logger_->info("开始处理股票数据...");
    
    auto stockFiles = dataReader_->getStockFileList();
        logger_->info("找到 " + std::to_string(static_cast<int>(stockFiles.size())) + " 个股票数据文件");    stocks_.clear();
    processedStockCount_ = 0;
    
    for (const auto& filename : stockFiles) {
        StockInfo stockInfo;
        
        if (dataReader_->readStockData(filename, stockInfo)) {
            // 验证数据
            if (analyzer_->validateStockData(stockInfo)) {
                // 计算移动平均线
                if (analyzer_->calculateMovingAverages(stockInfo)) {
                    stocks_.push_back(std::move(stockInfo));
                    processedStockCount_++;
                    
                    // 保存处理后的数据
                    resultWriter_->writeProcessedStockData(stockInfo, outputDir_);
                    
                    logger_->debug("成功处理股票: " + stockInfo.stockId + " " + stockInfo.stockName);
                } else {
                    logger_->warning("计算均线失败: " + filename);
                }
            } else {
                logger_->warning("数据验证失败: " + filename);
            }
        } else {
            logger_->warning("读取股票数据失败: " + filename);
        }
    }
    
    logger_->info("股票数据处理完成，共处理 " + std::to_string(processedStockCount_) + " 个股票");
    return true;
}

bool StockSearchTool::searchStocks(SearchMode mode) {
    if (!isInitialized_) {
        logger_->error("工具未初始化");
        return false;
    }
    
    if (stocks_.empty()) {
        logger_->error("没有股票数据可供搜索");
        return false;
    }
    
    logger_->info("开始搜索股票，模式: " + std::to_string(static_cast<int>(mode)));
    
    searchResults_.clear();
    foundStockCount_ = 0;
    
    for (const auto& stockInfo : stocks_) {
        SearchResult result;
        result.stockId = stockInfo.stockId;
        result.stockName = stockInfo.stockName;
        
        bool found = false;
        
        switch (mode) {
            case SearchMode::VOLUME_PRICE_ANALYSIS:
                found = searchAlgo_->searchMode1_VolumePriceAnalysis(stockInfo, result);
                break;
            case SearchMode::AVERAGE_LINE_ANALYSIS:
                found = searchAlgo_->searchMode2_AverageLineAnalysis(stockInfo, result);
                break;
            case SearchMode::MULTI_AVERAGE_UP:
                found = searchAlgo_->searchMode3_MultiAverageUp(stockInfo, result);
                break;
            case SearchMode::PRICE_UP_ANALYSIS:
                found = searchAlgo_->searchMode4_PriceUpAnalysis(stockInfo, result);
                break;
            default:
                logger_->error("未知的搜索模式: " + std::to_string(static_cast<int>(mode)));
                return false;
        }
        
        if (found) {
            searchResults_.push_back(result);
            foundStockCount_++;
            logger_->debug("找到符合条件的股票: " + result.stockId + " " + result.stockName);
        }
    }
    
    logger_->info("搜索完成，找到 " + std::to_string(foundStockCount_) + " 个符合条件的股票");
    
    // 写入搜索结果 - TXT格式
    if (!resultWriter_->writeSearchResults(searchResults_, mode)) {
        logger_->error("写入TXT格式搜索结果失败");
        return false;
    }
    
    // 写入搜索结果 - Markdown格式
    if (!resultWriter_->writeSearchResultsMarkdown(searchResults_, mode)) {
        logger_->error("写入Markdown格式搜索结果失败");
        return false;
    }
    
    return true;
}

bool StockSearchTool::generateReports() {
    if (!isInitialized_) {
        logger_->error("工具未初始化");
        return false;
    }
    
    logger_->info("生成汇总报告...");
    
    if (!resultWriter_->generateSummaryReport(searchResults_)) {
        logger_->error("生成汇总报告失败");
        return false;
    }
    
    logger_->info("汇总报告生成完成");
    return true;
}

void StockSearchTool::setLogLevel(LogLevel level) {
    if (logger_) {
        logger_->setLogLevel(level);
    }
}

void StockSearchTool::setSearchParameters(int searchDays, int volumeDays, 
                                        int volumeRatio, int pricePercent1, 
                                        int pricePercent2) {
    // 这里可以扩展为支持动态配置搜索参数
    logger_->info("设置搜索参数: 搜索天数=" + std::to_string(searchDays) + 
                 ", 成交量天数=" + std::to_string(volumeDays) + 
                 ", 成交量比例=" + std::to_string(volumeRatio) + 
                 ", 价格百分比1=" + std::to_string(pricePercent1) + 
                 ", 价格百分比2=" + std::to_string(pricePercent2));
}

const std::vector<SearchResult>& StockSearchTool::getSearchResults() const {
    return searchResults_;
}

int StockSearchTool::getProcessedStockCount() const {
    return processedStockCount_;
}

int StockSearchTool::getFoundStockCount() const {
    return foundStockCount_;
}

/**
 * StockDataReader 实现
 */
StockDataReader::StockDataReader(Logger* logger) : logger_(logger) {}

bool StockDataReader::setInputDirectory(const std::string& directory) {
    // 简单检查目录是否存在
    DIR* dir = opendir(directory.c_str());
    if (dir == nullptr) {
        logger_->error("输入目录不存在: " + directory);
        return false;
    }
    closedir(dir);
    
    inputDir_ = directory;
    logger_->info("设置输入目录: " + directory);
    return true;
}

std::vector<std::string> StockDataReader::getStockFileList() const {
    std::vector<std::string> fileList;
    
    DIR* dir = opendir(inputDir_.c_str());
    if (dir == nullptr) {
        logger_->error("无法打开目录: " + inputDir_);
        return fileList;
    }
    
    struct dirent* entry;
    while ((entry = readdir(dir)) != nullptr) {
        std::string filename = entry->d_name;
        
        // 跳过 . 和 .. 目录
        if (filename == "." || filename == "..") {
            continue;
        }
        
        // 只处理 .txt 文件
        if (filename.length() > 4 && filename.substr(filename.length() - 4) == ".txt") {
            fileList.push_back(filename);
        }
    }
    
    closedir(dir);
    std::sort(fileList.begin(), fileList.end());
    return fileList;
}

bool StockDataReader::readStockData(const std::string& filename, StockInfo& stockInfo) {
    std::string filepath = inputDir_ + "/" + filename;
    return parseStockFile(filepath, stockInfo);
}

bool StockDataReader::parseStockFile(const std::string& filepath, StockInfo& stockInfo) {
    // 尝试编码转换
    std::string actualFilepath = convertFileEncoding(filepath);
    
    std::ifstream file(actualFilepath);
    if (!file.is_open()) {
        logger_->error("无法打开文件: " + actualFilepath);
        return false;
    }
    
    std::string line;
    int lineNumber = 0;
    
    // 读取第一行：股票基本信息
    if (std::getline(file, line)) {
        lineNumber++;
        auto parts = Utils::splitString(Utils::trimString(line), ' ');
        if (parts.size() >= 2) {
            stockInfo.stockId = parts[0];
            stockInfo.stockName = parts[1];
        } else {
            logger_->error("第" + std::to_string(lineNumber) + "行格式错误: " + line);
            return false;
        }
    }
    
    // 跳过表头行
    if (std::getline(file, line)) {
        lineNumber++;
    }
    
    // 读取K线数据
    stockInfo.dayRecords.clear();
    int dayIndex = 0;
    
    while (std::getline(file, line)) {
        lineNumber++;
        line = Utils::trimString(line);
        if (line.empty()) continue;
        
        DayRecord record;
        record.dayIndex = dayIndex++;
        
        if (parseDataLine(line, record)) {
            stockInfo.dayRecords.push_back(record);
        } else {
            logger_->warning("第" + std::to_string(lineNumber) + "行数据解析失败: " + line);
        }
    }
    
    file.close();
    
    // 如果使用了临时转换文件，清理它
    if (actualFilepath != filepath && actualFilepath.find(".utf8") != std::string::npos) {
        std::remove(actualFilepath.c_str());
    }
    
    if (stockInfo.dayRecords.empty()) {
        logger_->error("文件中没有有效的K线数据: " + filepath);
        return false;
    }
    
    logger_->debug("成功读取股票数据: " + stockInfo.stockId + " " + stockInfo.stockName + 
                 ", " + std::to_string(static_cast<int>(stockInfo.dayRecords.size())) + "条记录");
    
    return true;
}

bool StockDataReader::parseDataLine(const std::string& line, DayRecord& record) {
    // 示例格式: 05/31/2023	11.00	11.72	10.79	10.89	15346788	173989552.00
    auto parts = Utils::splitString(line, '\t');
    if (parts.size() < 7) {
        return false;
    }
    
    try {
        record.recordDate = parseDate(Utils::trimString(parts[0]));
        record.openPrice = Utils::stringToDouble(Utils::trimString(parts[1]));
        record.highPrice = Utils::stringToDouble(Utils::trimString(parts[2]));
        record.lowPrice = Utils::stringToDouble(Utils::trimString(parts[3]));
        record.closePrice = Utils::stringToDouble(Utils::trimString(parts[4]));
        record.volume = Utils::stringToUint64(Utils::trimString(parts[5]));
        record.amount = Utils::stringToDouble(Utils::trimString(parts[6]));
        
        // 基本数据验证
        if (record.openPrice <= 0 || record.highPrice <= 0 || 
            record.lowPrice <= 0 || record.closePrice <= 0) {
            return false;
        }
        
        if (record.lowPrice > record.highPrice) {
            return false;
        }
        
        return true;
    } catch (...) {
        return false;
    }
}

Date StockDataReader::parseDate(const std::string& dateStr) {
    // 支持格式: MM/DD/YYYY 或 YYYY-MM-DD
    Date date;
    
    if (dateStr.find('/') != std::string::npos) {
        // MM/DD/YYYY 格式
        auto parts = Utils::splitString(dateStr, '/');
        if (parts.size() == 3) {
            date.month = std::stoi(parts[0]);
            date.day = std::stoi(parts[1]);
            date.year = std::stoi(parts[2]);
        }
    } else if (dateStr.find('-') != std::string::npos) {
        // YYYY-MM-DD 格式
        auto parts = Utils::splitString(dateStr, '-');
        if (parts.size() == 3) {
            date.year = std::stoi(parts[0]);
            date.month = std::stoi(parts[1]);
            date.day = std::stoi(parts[2]);
        }
    }
    
    return date;
}

std::string StockDataReader::convertFileEncoding(const std::string& filepath) {
    // 尝试读取文件的前几行来检测编码
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) {
        return filepath; // 如果无法打开文件，返回原路径
    }
    
    // 读取前1024字节来检测编码
    std::vector<char> buffer(1024);
    file.read(buffer.data(), buffer.size());
    file.close();
    
    std::string content(buffer.begin(), buffer.end());
    
    // 简单检测：如果包含明显的乱码字符，尝试GBK转换
    bool needsConversion = false;
    for (char c : content) {
        if (static_cast<unsigned char>(c) > 127) {
            // 检查是否包含高位字符（可能是GBK编码）
            needsConversion = true;
            break;
        }
    }
    
    if (needsConversion) {
        // 尝试使用系统命令进行编码转换
        std::string utf8_filepath = filepath + ".utf8";
        std::string command = "iconv -f gbk -t utf-8 \"" + filepath + "\" > \"" + utf8_filepath + "\" 2>/dev/null";
        
        int result = system(command.c_str());
        if (result == 0) {
            // 转换成功，检查转换后的文件是否存在
            std::ifstream test_file(utf8_filepath);
            if (test_file.good()) {
                test_file.close();
                logger_->info("文件编码已转换为UTF-8: " + utf8_filepath);
                return utf8_filepath;
            }
        }
    }
    
    return filepath; // 返回原文件路径
}

/**
 * StockAnalyzer 实现
 */
StockAnalyzer::StockAnalyzer(Logger* logger) : logger_(logger) {}

bool StockAnalyzer::calculateMovingAverages(StockInfo& stockInfo) {
    if (stockInfo.dayRecords.empty()) {
        logger_->error("股票数据为空，无法计算移动平均线");
        return false;
    }
    
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    
    // 计算各周期移动平均线
    for (int i = 0; i < recordCount; ++i) {
        stockInfo.dayRecords[i].ma5 = calculateMA(stockInfo.dayRecords, i, Config::MA_5);
        stockInfo.dayRecords[i].ma10 = calculateMA(stockInfo.dayRecords, i, Config::MA_10);
        stockInfo.dayRecords[i].ma20 = calculateMA(stockInfo.dayRecords, i, Config::MA_20);
        stockInfo.dayRecords[i].ma30 = calculateMA(stockInfo.dayRecords, i, Config::MA_30);
        stockInfo.dayRecords[i].ma60 = calculateMA(stockInfo.dayRecords, i, Config::MA_60);
        stockInfo.dayRecords[i].ma120 = calculateMA(stockInfo.dayRecords, i, Config::MA_120);
        stockInfo.dayRecords[i].ma250 = calculateMA(stockInfo.dayRecords, i, Config::MA_250);
    }
    
    logger_->debug("计算移动平均线完成: " + stockInfo.stockId);
    return true;
}

bool StockAnalyzer::validateStockData(const StockInfo& stockInfo) {
    if (stockInfo.stockId.empty() || stockInfo.stockName.empty()) {
        logger_->warning("股票基本信息不完整");
        return false;
    }
    
    if (stockInfo.dayRecords.size() < 30) {
        logger_->warning("股票数据不足30天，无法进行完整分析: " + stockInfo.stockId);
        return false;
    }
    
    // 检查数据完整性
    for (const auto& record : stockInfo.dayRecords) {
        if (record.openPrice <= 0 || record.highPrice <= 0 || 
            record.lowPrice <= 0 || record.closePrice <= 0) {
            logger_->warning("发现无效价格数据: " + stockInfo.stockId);
            return false;
        }
        
        if (record.lowPrice > record.highPrice) {
            logger_->warning("发现错误的价格关系 (低价>高价): " + stockInfo.stockId);
            return false;
        }
    }
    
    return true;
}

double StockAnalyzer::calculateMA(const std::vector<DayRecord>& records, int index, int period) {
    if (index < period - 1) {
        return 0.0; // 数据不足，返回0
    }
    
    double sum = 0.0;
    for (int i = index - period + 1; i <= index; ++i) {
        sum += records[i].closePrice;
    }
    
    return sum / period;
}

bool StockAnalyzer::findPriceExtremes(const StockInfo& stockInfo, int startIndex, 
                                     int endIndex, DayRecord& maxRecord, DayRecord& minRecord) {
    if (startIndex < 0 || endIndex >= static_cast<int>(stockInfo.dayRecords.size()) || 
        startIndex > endIndex) {
        return false;
    }
    
    maxRecord = stockInfo.dayRecords[startIndex];
    minRecord = stockInfo.dayRecords[startIndex];
    
    for (int i = startIndex + 1; i <= endIndex; ++i) {
        if (stockInfo.dayRecords[i].highPrice > maxRecord.highPrice) {
            maxRecord = stockInfo.dayRecords[i];
        }
        if (stockInfo.dayRecords[i].lowPrice < minRecord.lowPrice) {
            minRecord = stockInfo.dayRecords[i];
        }
    }
    
    return true;
}

bool StockAnalyzer::findVolumeExtremes(const StockInfo& stockInfo, int startIndex, 
                                      int endIndex, DayRecord& maxRecord, DayRecord& minRecord) {
    if (startIndex < 0 || endIndex >= static_cast<int>(stockInfo.dayRecords.size()) || 
        startIndex > endIndex) {
        return false;
    }
    
    maxRecord = stockInfo.dayRecords[startIndex];
    minRecord = stockInfo.dayRecords[startIndex];
    
    for (int i = startIndex + 1; i <= endIndex; ++i) {
        if (stockInfo.dayRecords[i].volume > maxRecord.volume && stockInfo.dayRecords[i].volume > 0) {
            maxRecord = stockInfo.dayRecords[i];
        }
        if (stockInfo.dayRecords[i].volume < minRecord.volume && stockInfo.dayRecords[i].volume > 0) {
            minRecord = stockInfo.dayRecords[i];
        }
    }
    
    return true;
}

/**
 * SearchAlgorithm 实现
 */
SearchAlgorithm::SearchAlgorithm(Logger* logger) : logger_(logger) {}

// 辅助函数：查找价格极值
bool findPriceExtremes(const StockInfo& stockInfo, int startIndex, int endIndex, 
                      DayRecord& maxRecord, DayRecord& minRecord) {
    if (startIndex < 0 || endIndex >= static_cast<int>(stockInfo.dayRecords.size()) || 
        startIndex > endIndex) {
        return false;
    }
    
    maxRecord = stockInfo.dayRecords[startIndex];
    minRecord = stockInfo.dayRecords[startIndex];
    
    for (int i = startIndex + 1; i <= endIndex; ++i) {
        if (stockInfo.dayRecords[i].highPrice > maxRecord.highPrice) {
            maxRecord = stockInfo.dayRecords[i];
        }
        if (stockInfo.dayRecords[i].lowPrice < minRecord.lowPrice) {
            minRecord = stockInfo.dayRecords[i];
        }
    }
    
    return true;
}

// 辅助函数：查找成交量极值
bool findVolumeExtremes(const StockInfo& stockInfo, int startIndex, int endIndex,
                       DayRecord& maxRecord, DayRecord& minRecord) {
    if (startIndex < 0 || endIndex >= static_cast<int>(stockInfo.dayRecords.size()) || 
        startIndex > endIndex) {
        return false;
    }
    
    maxRecord = stockInfo.dayRecords[startIndex];
    minRecord = stockInfo.dayRecords[startIndex];
    
    for (int i = startIndex + 1; i <= endIndex; ++i) {
        if (stockInfo.dayRecords[i].volume > maxRecord.volume && stockInfo.dayRecords[i].volume > 0) {
            maxRecord = stockInfo.dayRecords[i];
        }
        if (stockInfo.dayRecords[i].volume < minRecord.volume && stockInfo.dayRecords[i].volume > 0) {
            minRecord = stockInfo.dayRecords[i];
        }
    }
    
    return true;
}

bool SearchAlgorithm::searchMode1_VolumePriceAnalysis(const StockInfo& stockInfo, SearchResult& result) {
    // 成交量价格分析模式：使用6天滑动窗口在30天范围内分时间段分析
    
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < Config::SEARCH_DAY_SUM) {
        return false;
    }
    
    // 30天搜索范围
    int searchRange = std::min(30, recordCount);
    int searchStart = recordCount - searchRange;
    if (searchStart < 0) searchStart = 0;
    
    int windowSize = Config::VOLUME_DOWN_DAY_SUM; // 6天滑动窗口
    
    // 使用滑动窗口在30天范围内搜索
    bool foundValidPattern = false;
    DayRecord bestMaxPriceRecord, bestMinPriceRecord;
    DayRecord bestMaxVolumeRecord, bestMinVolumeRecord;
    double bestVolumeRatio = 0;
    double bestPriceDropPercent = 0;
    
    // 从最新交易日向前，使用6天滑动窗口
    for (int windowStart = recordCount - windowSize; windowStart >= searchStart; windowStart -= windowSize) {
        int windowEnd = windowStart + windowSize - 1;
        if (windowEnd >= recordCount) windowEnd = recordCount - 1;
        
        // 在当前6天窗口内找极值
        DayRecord windowMaxPrice = stockInfo.dayRecords[windowStart];
        DayRecord windowMinPrice = stockInfo.dayRecords[windowStart];
        
        for (int i = windowStart; i <= windowEnd; ++i) {
            const DayRecord& current = stockInfo.dayRecords[i];
            
            if (current.highPrice > windowMaxPrice.highPrice) {
                windowMaxPrice = current;
            }
            if (current.lowPrice < windowMinPrice.lowPrice) {
                windowMinPrice = current;
            }
        }
        
        // 检查时间顺序：最低价必须在最高价之后
        if (windowMinPrice.dayIndex <= windowMaxPrice.dayIndex) {
            continue;
        }
        
        // 检查价格下跌条件
        double priceDropAbsolute = windowMaxPrice.highPrice - windowMinPrice.lowPrice;
        double priceDropThreshold = (windowMaxPrice.highPrice / 100.0) * Config::PRICE_MAX_MIN_PERCENT;
        
        if (priceDropAbsolute < priceDropThreshold) {
            continue;
        }
        
        // 在窗口范围内找成交量极值
        int maxVolumeStart = std::max(windowStart, windowMaxPrice.dayIndex - 1);
        int maxVolumeEnd = windowMaxPrice.dayIndex;
        int minVolumeStart = windowMaxPrice.dayIndex;
        int minVolumeEnd = std::min(windowEnd, windowMinPrice.dayIndex + 1);
        
        DayRecord windowMaxVolume = stockInfo.dayRecords[maxVolumeStart];
        DayRecord windowMinVolume = stockInfo.dayRecords[minVolumeStart];
        
        // 搜索最大成交量
        for (int i = maxVolumeStart; i <= maxVolumeEnd; ++i) {
            if (stockInfo.dayRecords[i].volume > 0 && 
                stockInfo.dayRecords[i].volume > windowMaxVolume.volume) {
                windowMaxVolume = stockInfo.dayRecords[i];
            }
        }
        
        // 搜索最小成交量
        for (int i = minVolumeStart; i <= minVolumeEnd; ++i) {
            if (stockInfo.dayRecords[i].volume > 0 && 
                stockInfo.dayRecords[i].volume < windowMinVolume.volume) {
                windowMinVolume = stockInfo.dayRecords[i];
            }
        }
        
        if (windowMinVolume.volume == 0) {
            continue;
        }
        
        double volumeRatio = static_cast<double>(windowMaxVolume.volume) / windowMinVolume.volume;
        double priceDropPercent = (priceDropAbsolute * 100.0) / windowMaxPrice.highPrice;
        
        // 检查成交量条件，并记录最佳结果
        if (volumeRatio >= Config::VOLUME_MAX_MIN_MODE) {
            if (!foundValidPattern || volumeRatio > bestVolumeRatio || 
                (volumeRatio == bestVolumeRatio && priceDropPercent > bestPriceDropPercent)) {
                foundValidPattern = true;
                bestMaxPriceRecord = windowMaxPrice;
                bestMinPriceRecord = windowMinPrice;
                bestMaxVolumeRecord = windowMaxVolume;
                bestMinVolumeRecord = windowMinVolume;
                bestVolumeRatio = volumeRatio;
                bestPriceDropPercent = priceDropPercent;
            }
        }
    }
    
    if (foundValidPattern) {
        // 填充最佳结果
        result.maxPriceDate = bestMaxPriceRecord.recordDate;
        result.minPriceDate = bestMinPriceRecord.recordDate;
        result.maxVolumeDate = bestMaxVolumeRecord.recordDate;
        result.minVolumeDate = bestMinVolumeRecord.recordDate;
        
        result.maxPrice = bestMaxPriceRecord.highPrice;
        result.minPrice = bestMinPriceRecord.lowPrice;
        result.maxVolume = bestMaxVolumeRecord.volume;
        result.minVolume = bestMinVolumeRecord.volume;
        
        result.maxPriceDayCount = recordCount - 1 - bestMaxPriceRecord.dayIndex;
        result.minPriceDayCount = recordCount - 1 - bestMinPriceRecord.dayIndex;
        result.downDayCount = bestMinPriceRecord.dayIndex - bestMaxPriceRecord.dayIndex;
        result.volumePercent = static_cast<int>(bestVolumeRatio);
        result.decreasePricePercent = static_cast<int>(bestPriceDropPercent);
        
        return true;
    }
    
    return false;
}

bool SearchAlgorithm::searchMode2_AverageLineAnalysis(const StockInfo& stockInfo, SearchResult& result) {
    // 均线分析模式：查找价格接近各个周期均线的股票
    
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < Config::SEARCH_DAY_SUM) {
        return false;
    }
    
    // 检查最近几天的价格是否接近均线
    const auto& latestRecord = stockInfo.dayRecords[recordCount - 1];
    
    // 计算当前价格与各均线的差距百分比
    double diffPercent5 = std::abs(latestRecord.closePrice - latestRecord.ma5) * 100.0 / latestRecord.closePrice;
    double diffPercent10 = std::abs(latestRecord.closePrice - latestRecord.ma10) * 100.0 / latestRecord.closePrice;
    double diffPercent20 = std::abs(latestRecord.closePrice - latestRecord.ma20) * 100.0 / latestRecord.closePrice;
    
    // 如果价格接近任一均线（差距小于2%），则认为符合条件
    if (diffPercent5 < 2.0 || diffPercent10 < 2.0 || diffPercent20 < 2.0) {
        result.maxPriceDate = latestRecord.recordDate;
        result.minPriceDate = latestRecord.recordDate;
        result.maxPrice = latestRecord.closePrice;
        result.minPrice = latestRecord.closePrice;
        
        return true;
    }
    
    return false;
}

bool SearchAlgorithm::searchMode3_MultiAverageUp(const StockInfo& stockInfo, SearchResult& result) {
    // 多均线上涨模式：查找多条均线呈上升趋势的股票
    
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < Config::SEARCH_DAY_SUM) {
        return false;
    }
    
    // 检查最近的均线排列：5>10>20>30>60均线
    const auto& latestRecord = stockInfo.dayRecords[recordCount - 1];
    const auto& prevRecord = stockInfo.dayRecords[recordCount - 2];
    
    // 检查均线多头排列
    bool multiUp = (latestRecord.ma5 > latestRecord.ma10) &&
                   (latestRecord.ma10 > latestRecord.ma20) &&
                   (latestRecord.ma20 > latestRecord.ma30) &&
                   (latestRecord.ma30 > latestRecord.ma60);
    
    // 检查均线是否呈上升趋势
    bool trending = (latestRecord.ma20 > prevRecord.ma20) &&
                    (latestRecord.ma30 > prevRecord.ma30);
    
    if (multiUp && trending) {
        result.maxPriceDate = latestRecord.recordDate;
        result.minPriceDate = latestRecord.recordDate;
        result.maxPrice = latestRecord.closePrice;
        result.minPrice = latestRecord.closePrice;
        
        return true;
    }
    
    return false;
}

bool SearchAlgorithm::searchMode4_PriceUpAnalysis(const StockInfo& stockInfo, SearchResult& result) {
    // 价格上涨分析模式：查找价格上涨超过10%的股票
    
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < 45) { // SEARCH_MODE_4_SEARCH_DAY_SUM
        return false;
    }
    
    int searchStart = recordCount - 45;
    if (searchStart < 0) searchStart = 0;
    
    const auto& latestRecord = stockInfo.dayRecords[recordCount - 1];
    
    // 查找指定天数内的最低价
    double minPrice = latestRecord.closePrice;
    Date minPriceDate = latestRecord.recordDate;
    
    for (int i = searchStart; i < recordCount; ++i) {
        if (stockInfo.dayRecords[i].lowPrice < minPrice) {
            minPrice = stockInfo.dayRecords[i].lowPrice;
            minPriceDate = stockInfo.dayRecords[i].recordDate;
        }
    }
    
    // 计算涨幅
    double upPercent = ((latestRecord.closePrice - minPrice) * 100.0) / minPrice;
    
    if (upPercent >= 10.0) {
        result.maxPriceDate = latestRecord.recordDate;
        result.minPriceDate = minPriceDate;
        result.maxPrice = latestRecord.closePrice;
        result.minPrice = minPrice;
        result.decreasePricePercent = static_cast<int>(-upPercent); // 负值表示上涨
        
        return true;
    }
    
    return false;
}

bool SearchAlgorithm::checkVolumePriceCondition(const StockInfo& stockInfo, int dayRange, 
                                               int volumeRatio, int pricePercent) {
    // 检查成交量价格条件的辅助方法
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < dayRange) return false;
    
    int startIndex = recordCount - dayRange;
    
    DayRecord maxPriceRecord, minPriceRecord;
    DayRecord maxVolumeRecord, minVolumeRecord;
    
    if (!findPriceExtremes(stockInfo, startIndex, recordCount - 1, maxPriceRecord, minPriceRecord) ||
        !findVolumeExtremes(stockInfo, startIndex, recordCount - 1, maxVolumeRecord, minVolumeRecord)) {
        return false;
    }
    
    if (minVolumeRecord.volume == 0) return false;
    
    double actualVolumeRatio = static_cast<double>(maxVolumeRecord.volume) / minVolumeRecord.volume;
    double actualPricePercent = ((maxPriceRecord.highPrice - minPriceRecord.lowPrice) * 100.0) / maxPriceRecord.highPrice;
    
    return (actualVolumeRatio >= volumeRatio && actualPricePercent >= pricePercent);
}

bool SearchAlgorithm::checkAverageLineCondition(const StockInfo& stockInfo, int dayRange) {
    // 检查均线条件的辅助方法
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < dayRange) return false;
    
    const auto& latestRecord = stockInfo.dayRecords[recordCount - 1];
    
    // 简单检查：价格是否接近20日均线
    double diffPercent = std::abs(latestRecord.closePrice - latestRecord.ma20) * 100.0 / latestRecord.closePrice;
    return diffPercent < 2.0;
}

bool SearchAlgorithm::checkPriceUpCondition(const StockInfo& stockInfo, int dayRange, int upPercent) {
    // 检查价格上涨条件的辅助方法
    int recordCount = static_cast<int>(stockInfo.dayRecords.size());
    if (recordCount < dayRange) return false;
    
    int startIndex = recordCount - dayRange;
    const auto& latestRecord = stockInfo.dayRecords[recordCount - 1];
    
    double minPrice = latestRecord.closePrice;
    for (int i = startIndex; i < recordCount; ++i) {
        if (stockInfo.dayRecords[i].lowPrice < minPrice) {
            minPrice = stockInfo.dayRecords[i].lowPrice;
        }
    }
    
    double actualUpPercent = ((latestRecord.closePrice - minPrice) * 100.0) / minPrice;
    return actualUpPercent >= upPercent;
}

/**
 * ResultWriter 实现
 */
ResultWriter::ResultWriter(Logger* logger) : logger_(logger) {}

bool ResultWriter::setOutputDirectory(const std::string& directory) {
    if (!Utils::createDirectoryIfNotExists(directory)) {
        logger_->error("无法创建输出目录: " + directory);
        return false;
    }
    
    outputDir_ = directory;
    logger_->info("设置输出目录: " + directory);
    return true;
}

bool ResultWriter::writeSearchResults(const std::vector<SearchResult>& results, SearchMode mode) {
    std::string filename = getResultFileName(mode);
    return writeResultToFile(filename, results);
}

bool ResultWriter::writeSearchResultsMarkdown(const std::vector<SearchResult>& results, SearchMode mode) {
    std::string filename = getResultFileName(mode);
    // 将.txt替换为.md
    size_t pos = filename.find(".txt");
    if (pos != std::string::npos) {
        filename.replace(pos, 4, ".md");
    }
    return writeResultToMarkdownFile(filename, results);
}

bool ResultWriter::writeProcessedStockData(const StockInfo& stockInfo, const std::string& outputDir) {
    std::string filepath = outputDir + "/" + stockInfo.stockId + "_processed.txt";
    
    std::ofstream file(filepath);
    if (!file.is_open()) {
        logger_->error("无法创建处理结果文件: " + filepath);
        return false;
    }
    
    // 写入股票基本信息
    file << stockInfo.stockId << " " << stockInfo.stockName << " 处理结果\n";
    file << "日期\t开盘价\t最高价\t最低价\t收盘价\t成交量\t成交额\tMA5\tMA10\tMA20\tMA30\tMA60\tMA120\tMA250\n";
    
    // 写入K线数据和均线数据
    for (const auto& record : stockInfo.dayRecords) {
        file << record.recordDate.toString() << "\t"
             << Utils::doubleToString(record.openPrice) << "\t"
             << Utils::doubleToString(record.highPrice) << "\t"
             << Utils::doubleToString(record.lowPrice) << "\t"
             << Utils::doubleToString(record.closePrice) << "\t"
             << record.volume << "\t"
             << Utils::doubleToString(record.amount) << "\t"
             << Utils::doubleToString(record.ma5) << "\t"
             << Utils::doubleToString(record.ma10) << "\t"
             << Utils::doubleToString(record.ma20) << "\t"
             << Utils::doubleToString(record.ma30) << "\t"
             << Utils::doubleToString(record.ma60) << "\t"
             << Utils::doubleToString(record.ma120) << "\t"
             << Utils::doubleToString(record.ma250) << "\n";
    }
    
    file.close();
    logger_->debug("保存处理结果: " + filepath);
    return true;
}

bool ResultWriter::generateSummaryReport(const std::vector<SearchResult>& results) {
    std::string filepath = outputDir_ + "/summary_report.txt";
    
    std::ofstream file(filepath);
    if (!file.is_open()) {
        logger_->error("无法创建汇总报告文件: " + filepath);
        return false;
    }
    
    file << "股票搜索汇总报告\n";
    file << "生成时间: " << getCurrentTimeString() << "\n";
    file << "符合条件的股票数量: " << results.size() << "\n\n";
    
    if (!results.empty()) {
        // 复制结果向量并按最低价日期排序（从最近到最早）
        std::vector<SearchResult> sortedResults = results;
        std::sort(sortedResults.begin(), sortedResults.end(), 
                  [](const SearchResult& a, const SearchResult& b) {
                      // 按最低价日期排序，最近的日期在前（降序）
                      return b.minPriceDate < a.minPriceDate;
                  });
        
        file << "股票代码\t股票名称\t最高价日期\t最低价日期\t价格跌幅%\t成交量比例\n";
        
        for (const auto& result : sortedResults) {
            file << result.stockId << "\t"
                 << result.stockName << "\t"
                 << result.maxPriceDate.toString() << "\t"
                 << result.minPriceDate.toString() << "\t"
                 << result.decreasePricePercent << "\t"
                 << result.volumePercent << "\n";
        }
    }
    
    file.close();
    logger_->info("生成汇总报告: " + filepath);
    return true;
}

std::string ResultWriter::getResultFileName(SearchMode mode) {
    std::string baseName;
    
    switch (mode) {
        case SearchMode::VOLUME_PRICE_ANALYSIS:
            baseName = "volume_price_analysis_result.txt";
            break;
        case SearchMode::AVERAGE_LINE_ANALYSIS:
            baseName = "average_line_analysis_result.txt";
            break;
        case SearchMode::MULTI_AVERAGE_UP:
            baseName = "multi_average_up_result.txt";
            break;
        case SearchMode::PRICE_UP_ANALYSIS:
            baseName = "price_up_analysis_result.txt";
            break;
        default:
            baseName = "unknown_mode_result.txt";
            break;
    }
    
    return outputDir_ + "/" + baseName;
}

bool ResultWriter::writeResultToFile(const std::string& filename, const std::vector<SearchResult>& results) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        logger_->error("无法创建结果文件: " + filename);
        return false;
    }
    
    file << "═══════════════════════════════════════════════════════════════════════════════════════════════\n";
    file << "                              6天滑动窗口股票分析结果报告                                      \n";
    file << "═══════════════════════════════════════════════════════════════════════════════════════════════\n";
    file << "生成时间: " << getCurrentTimeString() << "\n";
    file << "分析范围: 30个交易日内，使用6天滑动窗口\n";
    file << "筛选条件: 价格下跌≥20%，成交量比例≥4倍\n";
    file << "符合条件的股票数量: " << results.size() << "\n\n";
    
    if (!results.empty()) {
        // 创建格式化的表格头
        file << "┌─────────┬────────────┬────────┬────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────┬──────┐\n";
        file << "│ 股票代码│   股票名称  │ 最高价 │ 最低价 │  最高价日期 │  最低价日期 │   最大成交量│   最小成交量│跌幅% │成交量│\n";
        file << "│         │            │        │        │             │             │             │             │      │比例  │\n";
        file << "├─────────┼────────────┼────────┼────────┼─────────────┼─────────────┼─────────────┼─────────────┼──────┼──────┤\n";
        
        // 输出数据行
        for (const auto& result : results) {
            file << "│" << std::setw(8) << std::left << result.stockId
                 << "│" << std::setw(12) << std::left << result.stockName
                 << "│" << std::setw(8) << std::right << Utils::doubleToString(result.maxPrice, 2)
                 << "│" << std::setw(8) << std::right << Utils::doubleToString(result.minPrice, 2)
                 << "│" << std::setw(13) << std::left << result.maxPriceDate.toString()
                 << "│" << std::setw(13) << std::left << result.minPriceDate.toString()
                 << "│" << std::setw(13) << std::right << result.maxVolume
                 << "│" << std::setw(13) << std::right << result.minVolume
                 << "│" << std::setw(6) << std::right << result.decreasePricePercent
                 << "│" << std::setw(6) << std::right << result.volumePercent << "│\n";
        }
        
        file << "└─────────┴────────────┴────────┴────────┴─────────────┴─────────────┴─────────────┴─────────────┴──────┴──────┘\n\n";
        
        // 添加统计信息
        file << "═══════════════════════════════════════════════════════════════════════════════════════════════\n";
        file << "                                     统计分析                                                 \n";
        file << "═══════════════════════════════════════════════════════════════════════════════════════════════\n";
        
        // 计算统计数据
        if (!results.empty()) {
            double avgPriceDrop = 0, maxPriceDrop = 0, minPriceDrop = 100;
            int avgVolumeRatio = 0, maxVolumeRatio = 0, minVolumeRatio = 1000;
            
            for (const auto& result : results) {
                avgPriceDrop += result.decreasePricePercent;
                maxPriceDrop = std::max(maxPriceDrop, static_cast<double>(result.decreasePricePercent));
                minPriceDrop = std::min(minPriceDrop, static_cast<double>(result.decreasePricePercent));
                
                avgVolumeRatio += result.volumePercent;
                maxVolumeRatio = std::max(maxVolumeRatio, result.volumePercent);
                minVolumeRatio = std::min(minVolumeRatio, result.volumePercent);
            }
            
            avgPriceDrop /= results.size();
            avgVolumeRatio /= results.size();
            
            file << "价格跌幅统计:\n";
            file << "  平均跌幅: " << Utils::doubleToString(avgPriceDrop, 1) << "%\n";
            file << "  最大跌幅: " << Utils::doubleToString(maxPriceDrop, 0) << "%\n";
            file << "  最小跌幅: " << Utils::doubleToString(minPriceDrop, 0) << "%\n\n";
            
            file << "成交量比例统计:\n";
            file << "  平均比例: " << avgVolumeRatio << "倍\n";
            file << "  最大比例: " << maxVolumeRatio << "倍\n";
            file << "  最小比例: " << minVolumeRatio << "倍\n\n";
        }
        
        file << "说明: 本报告使用6天滑动窗口在30个交易日范围内进行分析，\n";
        file << "      寻找价格下跌≥20%且成交量萎缩≥4倍的投资机会。\n";
    }
    
    file.close();
    logger_->info("写入搜索结果: " + filename);
    return true;
}

bool ResultWriter::writeResultToMarkdownFile(const std::string& filename, const std::vector<SearchResult>& results) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        logger_->error("无法创建结果文件: " + filename);
        return false;
    }
    
    // Markdown 标题
    file << "# 6天滑动窗口股票分析结果报告\n\n";
    file << "**生成时间:** " << getCurrentTimeString() << "\n\n";
    file << "**分析范围:** 30个交易日内，使用6天滑动窗口\n\n";
    file << "**筛选条件:** 价格下跌≥20%，成交量比例≥4倍\n\n";
    file << "**符合条件的股票数量:** " << results.size() << "\n\n";
    
    if (!results.empty()) {
        // Markdown 表格
        file << "## 分析结果\n\n";
        file << "| 股票代码 | 股票名称 | 最高价 | 最低价 | 最高价日期 | 最低价日期 | 最大成交量 | 最小成交量 | 跌幅% | 成交量比例 |\n";
        file << "|----------|----------|--------|--------|------------|------------|------------|------------|-------|------------|\n";
        
        for (size_t i = 0; i < results.size(); ++i) {
            const auto& result = results[i];
            file << "| " << result.stockId 
                 << " | " << result.stockName 
                 << " | " << Utils::doubleToString(result.maxPrice, 2)
                 << " | " << Utils::doubleToString(result.minPrice, 2)
                 << " | " << result.maxPriceDate.toString()
                 << " | " << result.minPriceDate.toString()
                 << " | " << result.maxVolume
                 << " | " << result.minVolume
                 << " | " << result.decreasePricePercent
                 << " | " << result.volumePercent << " |\n";
        }
        
        // 统计信息
        file << "\n## 统计分析\n\n";
        
        if (results.size() > 1) {
            double maxPriceDrop = 0, minPriceDrop = 100, avgPriceDrop = 0;
            int maxVolumeRatio = 0, minVolumeRatio = 1000, avgVolumeRatio = 0;
            
            for (const auto& result : results) {
                maxPriceDrop = std::max(maxPriceDrop, static_cast<double>(result.decreasePricePercent));
                minPriceDrop = std::min(minPriceDrop, static_cast<double>(result.decreasePricePercent));
                avgPriceDrop += result.decreasePricePercent;
                
                maxVolumeRatio = std::max(maxVolumeRatio, result.volumePercent);
                minVolumeRatio = std::min(minVolumeRatio, result.volumePercent);
                avgVolumeRatio += result.volumePercent;
            }
            
            avgPriceDrop /= results.size();
            avgVolumeRatio /= results.size();
            
            file << "### 价格跌幅统计\n\n";
            file << "- **平均跌幅:** " << Utils::doubleToString(avgPriceDrop, 1) << "%\n";
            file << "- **最大跌幅:** " << Utils::doubleToString(maxPriceDrop, 0) << "%\n";
            file << "- **最小跌幅:** " << Utils::doubleToString(minPriceDrop, 0) << "%\n\n";
            
            file << "### 成交量比例统计\n\n";
            file << "- **平均比例:** " << avgVolumeRatio << "倍\n";
            file << "- **最大比例:** " << maxVolumeRatio << "倍\n";
            file << "- **最小比例:** " << minVolumeRatio << "倍\n\n";
        }
        
        file << "## 说明\n\n";
        file << "本报告使用6天滑动窗口在30个交易日范围内进行分析，寻找价格下跌≥20%且成交量萎缩≥4倍的投资机会。\n\n";
        file << "### 分析方法\n\n";
        file << "1. **滑动窗口技术:** 使用6天滑动窗口在30个交易日范围内搜索\n";
        file << "2. **价格分析:** 识别期间内最高价与最低价的跌幅\n";
        file << "3. **成交量分析:** 计算最大成交量与最小成交量的比例\n";
        file << "4. **筛选条件:** 跌幅≥20%且成交量比例≥4倍\n\n";
        file << "### 投资建议\n\n";
        file << "> **风险提示:** 本分析仅供参考，投资有风险，入市需谨慎。\n";
    } else {
        file << "## 结果\n\n";
        file << "未找到符合条件的股票。\n\n";
        file << "**筛选条件:** 价格下跌≥20%，成交量比例≥4倍\n";
    }
    
    file.close();
    logger_->info("写入Markdown搜索结果: " + filename);
    return true;
}

/**
 * Logger 实现
 */
Logger::Logger() : currentLevel_(LogLevel::INFO), useFile_(false) {}

Logger::~Logger() {
    if (logFile_.is_open()) {
        logFile_.close();
    }
}

void Logger::setLogLevel(LogLevel level) {
    currentLevel_ = level;
}

void Logger::setLogFile(const std::string& filename) {
    if (logFile_.is_open()) {
        logFile_.close();
    }
    
    logFile_.open(filename, std::ios::app);
    useFile_ = logFile_.is_open();
    
    if (useFile_) {
        info("日志文件设置成功: " + filename);
    }
}

void Logger::debug(const std::string& message) {
    writeLog(LogLevel::DEBUG, message);
}

void Logger::info(const std::string& message) {
    writeLog(LogLevel::INFO, message);
}

void Logger::warning(const std::string& message) {
    writeLog(LogLevel::WARNING, message);
}

void Logger::error(const std::string& message) {
    writeLog(LogLevel::ERROR, message);
}

void Logger::writeLog(LogLevel level, const std::string& message) {
    if (level < currentLevel_) {
        return;
    }
    
    std::string timestamp = getCurrentTimeString();
    std::string levelStr = levelToString(level);
    std::string logMessage = "[" + timestamp + "] " + levelStr + ": " + message;
    
    // 输出到控制台
    std::cout << logMessage << std::endl;
    
    // 输出到文件
    if (useFile_ && logFile_.is_open()) {
        logFile_ << logMessage << std::endl;
        logFile_.flush();
    }
}

std::string Logger::levelToString(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO: return "INFO";
        case LogLevel::WARNING: return "WARNING";
        case LogLevel::ERROR: return "ERROR";
        default: return "UNKNOWN";
    }
}

std::string Logger::getCurrentTimeString() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

/**
 * Utils 实现
 */
namespace Utils {

bool createDirectoryIfNotExists(const std::string& path) {
    struct stat st = {0};
    if (stat(path.c_str(), &st) == -1) {
        // 目录不存在，创建它
        #ifdef _WIN32
        return _mkdir(path.c_str()) == 0;
        #else
        return mkdir(path.c_str(), 0755) == 0;
        #endif
    }
    return true; // 目录已存在
}

bool fileExists(const std::string& filename) {
    struct stat buffer;
    return (stat(filename.c_str(), &buffer) == 0);
}

std::vector<std::string> splitString(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    std::stringstream ss(str);
    std::string token;
    
    while (std::getline(ss, token, delimiter)) {
        tokens.push_back(token);
    }
    
    return tokens;
}

std::string trimString(const std::string& str) {
    size_t start = str.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) {
        return "";
    }
    
    size_t end = str.find_last_not_of(" \t\n\r");
    return str.substr(start, end - start + 1);
}

double stringToDouble(const std::string& str, double defaultValue) {
    try {
        return std::stod(str);
    } catch (...) {
        return defaultValue;
    }
}

uint64_t stringToUint64(const std::string& str, uint64_t defaultValue) {
    try {
        return std::stoull(str);
    } catch (...) {
        return defaultValue;
    }
}

std::string doubleToString(double value, int precision) {
    std::stringstream ss;
    ss << std::fixed << std::setprecision(precision) << value;
    return ss.str();
}

std::string getCurrentTimeString() {
    return ::StockSearch::getCurrentTimeString(); // 使用命名空间内的函数
}

} // namespace Utils

} // namespace StockSearch
