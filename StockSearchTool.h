#ifndef STOCK_SEARCH_TOOL_H
#define STOCK_SEARCH_TOOL_H

#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <map>
#include <memory>
#include <cmath>
#include <algorithm>
#include <dirent.h>
#include <sys/stat.h>

/**
 * 股票搜索工具 - 头文件
 * 功能：分析股票K线数据，根据特定搜索条件筛选股票
 * 
 * 主要功能模块：
 * 1. 股票数据读取和解析
 * 2. K线数据分析和均线计算
 * 3. 多种搜索条件算法
 * 4. 结果输出和数据保存
 * 5. 错误处理和日志记录
 */

namespace StockSearch {

// 配置常量
namespace Config {
    // 搜索参数
    constexpr int SEARCH_DAY_SUM = 250;                    // 搜索天数范围
    constexpr int VOLUME_DOWN_DAY_SUM = 6;                 // 成交量下跌天数统计
    constexpr int VOLUME_MAX_MIN_MODE = 4;                 // 成交量最大最小比例
    constexpr int PRICE_MAX_MIN_PERCENT = 20;              // 价格最大最小百分比
    constexpr int PRICE_MAX_MIN_PERCENT_2 = 17;            // 价格最大最小百分比2
    constexpr int PRICE_MAX_MIN_PERCENT_3 = 8;             // 价格最大最小百分比3
    
    // 均线周期
    constexpr int MA_5 = 5;
    constexpr int MA_10 = 10;
    constexpr int MA_20 = 20;
    constexpr int MA_30 = 30;
    constexpr int MA_60 = 60;
    constexpr int MA_120 = 120;
    constexpr int MA_250 = 250;
    
    // 文件路径
    const std::string DEFAULT_INPUT_DIR = "stock_data_in";
    const std::string DEFAULT_OUTPUT_DIR = "stock_data_out";
    const std::string DEFAULT_RESULT_DIR = "stock_search_result";
}

// 日期结构
struct Date {
    int year;
    int month;
    int day;
    
    Date() : year(0), month(0), day(0) {}
    Date(int y, int m, int d) : year(y), month(m), day(d) {}
    
    std::string toString() const {
        return std::to_string(year) + "-" + 
               (month < 10 ? "0" : "") + std::to_string(month) + "-" + 
               (day < 10 ? "0" : "") + std::to_string(day);
    }
    
    bool operator<(const Date& other) const {
        if (year != other.year) return year < other.year;
        if (month != other.month) return month < other.month;
        return day < other.day;
    }
};

// K线数据记录
struct DayRecord {
    int dayIndex;                    // 第几个交易日（从0开始）
    Date recordDate;                 // 交易日期
    double openPrice;                // 开盘价
    double highPrice;                // 最高价
    double lowPrice;                 // 最低价
    double closePrice;               // 收盘价
    uint64_t volume;                 // 成交量
    double amount;                   // 成交额
    
    // 移动平均线
    double ma5;                      // 5日均线
    double ma10;                     // 10日均线
    double ma20;                     // 20日均线
    double ma30;                     // 30日均线
    double ma60;                     // 60日均线
    double ma120;                    // 120日均线
    double ma250;                    // 250日均线
    
    DayRecord() : dayIndex(0), openPrice(0), highPrice(0), lowPrice(0), 
                  closePrice(0), volume(0), amount(0),
                  ma5(0), ma10(0), ma20(0), ma30(0), ma60(0), ma120(0), ma250(0) {}
};

// 股票基本信息
struct StockInfo {
    std::string stockId;             // 股票代码
    std::string stockName;           // 股票名称
    std::vector<DayRecord> dayRecords; // K线数据记录
    
    StockInfo() = default;
    StockInfo(const std::string& id, const std::string& name) 
        : stockId(id), stockName(name) {}
};

// 搜索结果报告
struct SearchResult {
    std::string stockId;             // 股票代码
    std::string stockName;           // 股票名称
    Date maxPriceDate;               // 最高价日期
    Date minPriceDate;               // 最低价日期
    Date maxVolumeDate;              // 最大成交量日期
    Date minVolumeDate;              // 最小成交量日期
    
    int minPriceDayCount;            // 最低价格距离现在的天数
    int maxPriceDayCount;            // 最高价格距离现在的天数
    int downDayCount;                // 从最高价到最低价的天数
    int volumePercent;               // 最高价时成交量与最低价时成交量的比率
    int decreasePricePercent;        // 下跌百分比
    
    // 扩展字段
    double maxPrice;                 // 最高价
    double minPrice;                 // 最低价
    uint64_t maxVolume;              // 最大成交量
    uint64_t minVolume;              // 最小成交量
    
    SearchResult() : minPriceDayCount(0), maxPriceDayCount(0), downDayCount(0),
                     volumePercent(0), decreasePricePercent(0),
                     maxPrice(0), minPrice(0), maxVolume(0), minVolume(0) {}
};

// 搜索条件枚举
enum class SearchMode {
    VOLUME_PRICE_ANALYSIS = 1,       // 成交量价格分析模式
    AVERAGE_LINE_ANALYSIS = 2,       // 均线分析模式
    MULTI_AVERAGE_UP = 3,            // 多均线上涨模式
    PRICE_UP_ANALYSIS = 4            // 价格上涨分析模式
};

// 日志级别
enum class LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3
};

// 前向声明
class StockDataReader;
class StockAnalyzer;
class SearchAlgorithm;
class ResultWriter;
class Logger;

/**
 * 主要的股票搜索工具类
 */
class StockSearchTool {
public:
    StockSearchTool();
    ~StockSearchTool();
    
    // 主要接口
    bool initialize(const std::string& inputDir = Config::DEFAULT_INPUT_DIR,
                   const std::string& outputDir = Config::DEFAULT_OUTPUT_DIR,
                   const std::string& resultDir = Config::DEFAULT_RESULT_DIR);
    
    bool processAllStocks();
    bool searchStocks(SearchMode mode);
    bool generateReports();
    
    // 配置方法
    void setLogLevel(LogLevel level);
    void setSearchParameters(int searchDays, int volumeDays, int volumeRatio, 
                           int pricePercent1, int pricePercent2);
    
    // 获取结果
    const std::vector<SearchResult>& getSearchResults() const;
    int getProcessedStockCount() const;
    int getFoundStockCount() const;
    
private:
    std::unique_ptr<StockDataReader> dataReader_;
    std::unique_ptr<StockAnalyzer> analyzer_;
    std::unique_ptr<SearchAlgorithm> searchAlgo_;
    std::unique_ptr<ResultWriter> resultWriter_;
    std::unique_ptr<Logger> logger_;
    
    std::string inputDir_;
    std::string outputDir_;
    std::string resultDir_;
    
    std::vector<StockInfo> stocks_;
    std::vector<SearchResult> searchResults_;
    
    int processedStockCount_;
    int foundStockCount_;
    
    bool isInitialized_;
};

/**
 * 股票数据读取器
 */
class StockDataReader {
public:
    StockDataReader(Logger* logger);
    ~StockDataReader() = default;
    
    bool setInputDirectory(const std::string& directory);
    std::vector<std::string> getStockFileList() const;
    bool readStockData(const std::string& filename, StockInfo& stockInfo);
    
private:
    std::string inputDir_;
    Logger* logger_;
    
    bool parseStockFile(const std::string& filepath, StockInfo& stockInfo);
    bool parseDataLine(const std::string& line, DayRecord& record);
    Date parseDate(const std::string& dateStr);
    std::string convertFileEncoding(const std::string& filepath);
};

/**
 * 股票数据分析器
 */
class StockAnalyzer {
public:
    StockAnalyzer(Logger* logger);
    ~StockAnalyzer() = default;
    
    bool calculateMovingAverages(StockInfo& stockInfo);
    bool validateStockData(const StockInfo& stockInfo);
    
    // 分析方法
    double calculateMA(const std::vector<DayRecord>& records, int index, int period);
    bool findPriceExtremes(const StockInfo& stockInfo, int startIndex, int endIndex,
                          DayRecord& maxRecord, DayRecord& minRecord);
    bool findVolumeExtremes(const StockInfo& stockInfo, int startIndex, int endIndex,
                           DayRecord& maxRecord, DayRecord& minRecord);
    
private:
    Logger* logger_;
};

/**
 * 搜索算法实现
 */
class SearchAlgorithm {
public:
    SearchAlgorithm(Logger* logger);
    ~SearchAlgorithm() = default;
    
    bool searchMode1_VolumePriceAnalysis(const StockInfo& stockInfo, SearchResult& result);
    bool searchMode2_AverageLineAnalysis(const StockInfo& stockInfo, SearchResult& result);
    bool searchMode3_MultiAverageUp(const StockInfo& stockInfo, SearchResult& result);
    bool searchMode4_PriceUpAnalysis(const StockInfo& stockInfo, SearchResult& result);
    
private:
    Logger* logger_;
    
    bool checkVolumePriceCondition(const StockInfo& stockInfo, int dayRange, 
                                  int volumeRatio, int pricePercent);
    bool checkAverageLineCondition(const StockInfo& stockInfo, int dayRange);
    bool checkPriceUpCondition(const StockInfo& stockInfo, int dayRange, int upPercent);
};

/**
 * 结果输出器
 */
class ResultWriter {
public:
    ResultWriter(Logger* logger);
    ~ResultWriter() = default;
    
    bool setOutputDirectory(const std::string& directory);
    bool writeSearchResults(const std::vector<SearchResult>& results, SearchMode mode);
    bool writeSearchResultsMarkdown(const std::vector<SearchResult>& results, SearchMode mode);
    bool writeProcessedStockData(const StockInfo& stockInfo, const std::string& outputDir);
    bool generateSummaryReport(const std::vector<SearchResult>& results);
    
private:
    std::string outputDir_;
    Logger* logger_;
    
    std::string getResultFileName(SearchMode mode);
    bool writeResultToFile(const std::string& filename, const std::vector<SearchResult>& results);
    bool writeResultToMarkdownFile(const std::string& filename, const std::vector<SearchResult>& results);
};

/**
 * 日志记录器
 */
class Logger {
public:
    Logger();
    ~Logger();
    
    void setLogLevel(LogLevel level);
    void setLogFile(const std::string& filename);
    
    void debug(const std::string& message);
    void info(const std::string& message);
    void warning(const std::string& message);
    void error(const std::string& message);
    
private:
    LogLevel currentLevel_;
    std::ofstream logFile_;
    bool useFile_;
    
    void writeLog(LogLevel level, const std::string& message);
    std::string levelToString(LogLevel level);
    std::string getCurrentTimeString();
};

// 工具函数
namespace Utils {
    bool createDirectoryIfNotExists(const std::string& path);
    bool fileExists(const std::string& filename);
    std::vector<std::string> splitString(const std::string& str, char delimiter);
    std::string trimString(const std::string& str);
    double stringToDouble(const std::string& str, double defaultValue = 0.0);
    uint64_t stringToUint64(const std::string& str, uint64_t defaultValue = 0);
    std::string doubleToString(double value, int precision = 2);
}

} // namespace StockSearch

#endif // STOCK_SEARCH_TOOL_H
