import { StockData, StockFileData } from './types';

interface DatasetInfo {
  id: string;
  name: string;
  date: string;
  count: number;
}

// IndexedDB 版本
const DB_VERSION = 2;
const DB_NAME = 'stockAnalysisDB';
const DATASET_STORE = 'datasets';
const STOCK_DATA_STORE = 'stockData';
const RAW_DATA_STORE = 'rawStockData';

/**
 * 初始化 IndexedDB 数据库
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('数据库打开失败:', event);
      reject('无法打开 IndexedDB 数据库');
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      // 创建数据集信息存储
      if (!db.objectStoreNames.contains(DATASET_STORE)) {
        const datasetStore = db.createObjectStore(DATASET_STORE, { keyPath: 'id' });
        datasetStore.createIndex('dateIndex', 'date', { unique: false });
      }
      
      // 创建股票数据存储
      if (!db.objectStoreNames.contains(STOCK_DATA_STORE)) {
        const stockDataStore = db.createObjectStore(STOCK_DATA_STORE, { keyPath: ['datasetId', 'stockCode'] });
        stockDataStore.createIndex('datasetIndex', 'datasetId', { unique: false });
      }
      
      // 版本2: 添加原始数据存储
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('rawStockData')) {
          const rawDataStore = db.createObjectStore('rawStockData', { keyPath: ['datasetId', 'stockCode'] });
          rawDataStore.createIndex('datasetIndex', 'datasetId', { unique: false });
        }
      }
    };
  });
}

/**
 * 保存数据集到 IndexedDB
 */
export async function saveDataset(
  name: string, 
  data: {
    processedData: StockData[],
    rawData: StockFileData[]
  }
): Promise<string> {
  try {
    const db = await initDB();
    const datasetId = `dataset_${Date.now()}`;
    const transaction = db.transaction([DATASET_STORE, STOCK_DATA_STORE, RAW_DATA_STORE], 'readwrite');
    
    // 保存数据集信息
    const datasetInfo: DatasetInfo = {
      id: datasetId,
      name: name || `数据集 ${new Date().toLocaleString('zh-CN')}`,
      date: new Date().toISOString(),
      count: data.processedData.length
    };
    
    const datasetStore = transaction.objectStore(DATASET_STORE);
    await promisifyRequest(datasetStore.add(datasetInfo));
    
    // 保存处理后的股票数据
    const stockDataStore = transaction.objectStore(STOCK_DATA_STORE);
    const processedDataPromises = data.processedData.map(stock => {
      return promisifyRequest(stockDataStore.add({
        ...stock,
        datasetId
      }));
    });
    
    // 保存原始股票数据
    const rawDataStore = transaction.objectStore(RAW_DATA_STORE);
    const rawDataPromises = data.rawData.map(rawStock => {
      return promisifyRequest(rawDataStore.add({
        ...rawStock,
        datasetId
      }));
    });
    
    await Promise.all([...processedDataPromises, ...rawDataPromises]);
    return datasetId;
  } catch (error) {
    console.error('保存数据集失败:', error);
    throw error;
  }
}

/**
 * 获取所有数据集信息
 */
export async function getDatasets(): Promise<DatasetInfo[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction(DATASET_STORE, 'readonly');
    const store = transaction.objectStore(DATASET_STORE);
    const datasets = await promisifyRequest<DatasetInfo[]>(store.getAll());
    
    // 按日期降序排序
    return datasets.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('获取数据集失败:', error);
    return [];
  }
}

/**
 * 根据数据集 ID 获取处理后的股票数据
 */
export async function getStockDataByDatasetId(datasetId: string): Promise<StockData[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction(STOCK_DATA_STORE, 'readonly');
    const store = transaction.objectStore(STOCK_DATA_STORE);
    const index = store.index('datasetIndex');
    const stocks = await promisifyRequest<(StockData & { datasetId: string })[]>(
      index.getAll(IDBKeyRange.only(datasetId))
    );
    
    // 移除 datasetId 属性，返回纯 StockData
    return stocks.map(({ datasetId, ...stock }) => stock as StockData);
  } catch (error) {
    console.error(`获取数据集 ${datasetId} 的股票数据失败:`, error);
    return [];
  }
}

/**
 * 根据数据集 ID 获取原始股票数据
 */
export async function getRawStockDataByDatasetId(datasetId: string): Promise<StockFileData[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction(RAW_DATA_STORE, 'readonly');
    const store = transaction.objectStore(RAW_DATA_STORE);
    const index = store.index('datasetIndex');
    const rawData = await promisifyRequest<(StockFileData & { datasetId: string })[]>(
      index.getAll(IDBKeyRange.only(datasetId))
    );
    
    // 移除 datasetId 属性，返回纯 StockFileData
    return rawData.map(({ datasetId, ...data }) => data as StockFileData);
  } catch (error) {
    console.error(`获取数据集 ${datasetId} 的原始股票数据失败:`, error);
    return [];
  }
}

/**
 * 删除数据集及其所有股票数据
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([DATASET_STORE, STOCK_DATA_STORE, RAW_DATA_STORE], 'readwrite');
    
    // 删除数据集信息
    const datasetStore = transaction.objectStore(DATASET_STORE);
    await promisifyRequest(datasetStore.delete(datasetId));
    
    // 删除处理后的股票数据
    const stockDataStore = transaction.objectStore(STOCK_DATA_STORE);
    const stockDataIndex = stockDataStore.index('datasetIndex');
    const stockKeys = await promisifyRequest<IDBValidKey[]>(
      stockDataIndex.getAllKeys(IDBKeyRange.only(datasetId))
    );
    
    const deleteStockPromises = stockKeys.map(key => 
      promisifyRequest(stockDataStore.delete(key))
    );
    
    // 删除原始股票数据
    const rawDataStore = transaction.objectStore(RAW_DATA_STORE);
    const rawDataIndex = rawDataStore.index('datasetIndex');
    const rawDataKeys = await promisifyRequest<IDBValidKey[]>(
      rawDataIndex.getAllKeys(IDBKeyRange.only(datasetId))
    );
    
    const deleteRawPromises = rawDataKeys.map(key => 
      promisifyRequest(rawDataStore.delete(key))
    );
    
    await Promise.all([...deleteStockPromises, ...deleteRawPromises]);
  } catch (error) {
    console.error(`删除数据集 ${datasetId} 失败:`, error);
    throw error;
  }
}

/**
 * 将 IndexedDB 请求转换为 Promise
 */
function promisifyRequest<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}
