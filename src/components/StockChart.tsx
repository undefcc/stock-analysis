'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { StockData } from '@/lib/types'

interface StockChartProps {
  data: StockData[]
}

export default function StockChart({ data }: StockChartProps) {
  // 按跌幅范围分组
  const chartData = [
    {
      name: '20-22%',
      count: data.filter(s => s.decreasePercent >= 20 && s.decreasePercent < 22).length,
      fill: '#FEF3C7'
    },
    {
      name: '22-25%',
      count: data.filter(s => s.decreasePercent >= 22 && s.decreasePercent < 25).length,
      fill: '#FED7AA'
    },
    {
      name: '25-28%',
      count: data.filter(s => s.decreasePercent >= 25 && s.decreasePercent < 28).length,
      fill: '#FECACA'
    },
    {
      name: '28-31%',
      count: data.filter(s => s.decreasePercent >= 28 && s.decreasePercent < 31).length,
      fill: '#FCA5A5'
    },
    {
      name: '31%+',
      count: data.filter(s => s.decreasePercent >= 31).length,
      fill: '#F87171'
    }
  ]

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="股票数量" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
