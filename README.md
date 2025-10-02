# 股票搜索工具 Dashboard

一个基于 Next.js 构建的现代化股票搜索和分析工具，提供直观的图形化界面。

## 功能特性

- 📊 **实时数据展示** - 展示股票搜索结果和关键统计信息
- � **批量文件上传** - 支持批量上传txt格式的股票历史数据文件
- �🔍 **智能搜索** - 支持按股票代码或名称搜索
- 📈 **数据可视化** - 使用图表展示跌幅分布
- 🎯 **多种排序** - 支持按最低价日期、跌幅、成交量比例排序
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎨 **现代 UI** - 使用 Tailwind CSS 构建美观界面
- 🔄 **数据源切换** - 支持示例数据和上传数据之间切换

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS
- **图表库**: Recharts
- **图标库**: Lucide React
- **构建工具**: Next.js 内置构建工具

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── StockDashboard.tsx # 主仪表板组件
│   ├── StockTable.tsx     # 股票数据表格
│   ├── StockChart.tsx     # 数据可视化图表
│   └── FileUpload.tsx     # 文件上传组件
└── lib/                   # 工具库和类型定义
    ├── types.ts          # TypeScript 类型定义
    ├── mockData.ts       # 模拟数据
    └── stockFileParser.ts # 股票文件解析工具
```

## 主要组件

### StockDashboard

主仪表板组件，包含：
- 统计卡片展示关键指标
- 搜索和过滤功能
- 数据可视化图表
- 股票列表表格

### StockTable

数据表格组件，功能包括：
- 显示股票详细信息
- 颜色编码表示不同跌幅范围
- 响应式设计

### FileUpload

文件上传组件，功能包括：
- 支持拖拽和点击上传
- 批量处理txt格式的股票数据文件
- 实时显示处理进度
- 文件格式验证和错误处理

## 支持的文件格式

应用程序支持以下格式的股票数据文件：

```
股票代码 股票名称 [其他信息]
[表头行]
日期 开盘价 最高价 最低价 收盘价 成交量 成交额
01/03/2020 3.30 3.30 3.30 3.30 667000 2001000.00
01/13/2020 3.15 3.15 3.15 3.15 3000 9450.00
...
```

**文件要求：**
- 文件扩展名：`.txt`
- 编码格式：支持UTF-8和GBK
- 第一行：股票代码和股票名称（空格分隔）
- 数据行：日期、开盘价、最高价、最低价、收盘价、成交量、成交额（空格或制表符分隔）
- 日期格式：MM/DD/YYYY 或其他标准日期格式

## 使用方法

### 上传股票数据文件

1. 点击页面右上角的"上传文件"按钮
2. 拖拽或选择txt格式的股票数据文件
3. 系统自动解析文件并计算分析结果
4. 查看分析后的股票数据

### 数据分析说明

系统会自动分析上传的股票数据文件，计算以下指标：
- **最高价日期**：历史数据中的最高价格对应的日期
- **最低价日期**：历史数据中的最低价格对应的日期  
- **价格跌幅%**：从最高价到最低价的跌幅百分比
- **成交量比例**：最高价日期的成交量与平均成交量的比例

分析结果默认按最低价日期排序（从最近到最早），方便用户快速找到最近触底的股票。

## 数据结构

```typescript
interface StockData {
  stockCode: string        // 股票代码
  stockName: string        // 股票名称
  maxPriceDate: string     // 最高价日期
  minPriceDate: string     // 最低价日期
  decreasePercent: number  // 价格跌幅百分比
  volumeRatio: number      // 成交量比例
}
```

## 自定义配置

### 添加新的数据源

1. 修改 `src/lib/types.ts` 定义数据结构
2. 更新 `src/lib/mockData.ts` 或连接实际数据 API
3. 在 `StockDashboard` 组件中更新数据处理逻辑

### 自定义主题

修改 `tailwind.config.js` 和 `src/app/globals.css` 来自定义颜色和样式。

## 部署

### 静态导出

项目配置了静态导出，可以部署到任何静态托管服务：

```bash
npm run build
```

构建的文件将在 `out/` 目录中。

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 上导入项目
3. 自动部署完成

## 开发说明

- 使用 TypeScript 确保类型安全
- 遵循 Next.js App Router 最佳实践
- 组件采用函数式设计，支持 React Hooks
- 使用 ESLint 进行代码质量检查

## 许可证

MIT License
