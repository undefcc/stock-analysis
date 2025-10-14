// 测试高于历史区间算法的新功能
const { analyzeHigherThanHistory } = require('./src/lib/algorithms/higherThanHistory.ts');

// 模拟股票数据（需要足够的数据来测试所有条件）
const mockStockData = {
  stockCode: "000001",
  stockName: "测试股票",
  dayRecords: []
};

// 生成200天的模拟数据
const basePrice = 10;
const today = new Date();

for (let i = 199; i >= 0; i--) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);
  
  // 模拟价格变化
  const dayOffset = Math.sin(i / 20) * 2 + (199 - i) * 0.01; // 整体上升趋势
  const price = basePrice + dayOffset + (Math.random() - 0.5) * 0.5;
  
  mockStockData.dayRecords.push({
    date: date.toISOString().split('T')[0],
    openPrice: price * (0.995 + Math.random() * 0.01),
    highPrice: price * (1.005 + Math.random() * 0.01),
    lowPrice: price * (0.99 + Math.random() * 0.01),
    closePrice: price,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    amount: Math.floor(Math.random() * 100000000) + 1000000
  });
}

// 测试新的高于历史区间算法
const config = {
  lookbackDays: 30,
  minimumRange: 0.1,
  maxPriceRangePercent: 20,
  targetDateIndex: 0,
  ma20DiffPercent: 2,
  ma20ConsecutiveDays: 5
};

console.log('测试高于历史区间算法（包含新条件）...');
console.log('配置:', config);

try {
  const result = analyzeHigherThanHistory(mockStockData, config);
  
  if (result) {
    console.log('✅ 算法分析成功！');
    console.log('结果:', {
      stockCode: result.stockCode,
      stockName: result.stockName,
      maxPriceDate: result.maxPriceDate,
      minPriceDate: result.minPriceDate,
      decreasePercent: result.decreasePercent,
      maxPrice: result.maxPrice,
      minPrice: result.minPrice
    });
  } else {
    console.log('❌ 股票不符合所有条件');
  }
} catch (error) {
  console.error('❌ 算法执行出错:', error.message);
}
