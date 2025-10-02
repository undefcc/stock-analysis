'use client'

import { StockData } from '@/lib/types'

interface StockTableProps {
  data: StockData[]
}

export default function StockTable({ data }: StockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              股票代码
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              股票名称
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              最高价日期
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              最低价日期
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              最低价天数
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              下跌天数
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              价格跌幅%
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              成交量比例
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((stock, index) => (
            <tr key={stock.stockCode} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {stock.stockCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.stockName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.maxPriceDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.minPriceDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.minPriceDayCount !== undefined ? (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    stock.minPriceDayCount <= 3 
                      ? 'bg-red-100 text-red-800' 
                      : stock.minPriceDayCount <= 10 
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {stock.minPriceDayCount}天
                  </span>
                ) : '未知'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.downDayCount !== undefined ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {stock.downDayCount}天
                  </span>
                ) : '未知'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  stock.decreasePercent >= 25 
                    ? 'bg-red-100 text-red-800' 
                    : stock.decreasePercent >= 20 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {stock.decreasePercent}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {stock.volumeRatio}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
