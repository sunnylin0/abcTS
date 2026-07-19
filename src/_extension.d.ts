// string-ext.d.ts
declare interface String {
	/**
	 * 將字串轉換為數字，並增強了解析能力
	 * - 支援十六進位(0x)、二進位(0b)、八進位(0o)前綴
	 * - 支持科學計數法 (1.23e4)
	 * - 自動修剪和刪除空白
	 * - 優雅地處理尾隨字符
	 * @returns Parsed number or NaN
	 */
	toNumber(options?: NumberConversionOptions): number;
}



// 定義一個全域的擴展對象，假設這些擴展是掛載在全域對像上的

declare interface Object {
	/** 複製物件 */
	clone<T>(this: T): T;
	/** 取得物件的所有可枚舉屬性鍵 */
	keys<T>(this: T): Array<keyof T>;
}

declare interface Array<T> {
	/** 克隆備份 */
	clone(): T[];
	/** 對資料庫中的各個元素執行迭代器函數 */
	each(iterator: (item: T, index?: number, array?: T[]) => void, context?: any): void;
	/** 取得備份的最後一個元素 */
	last(): T | null;
	/** 傳回一個新的資料庫，該資料庫備份原資料庫中的所有非假值元素 */
	compact(): T[];
	/** 使用提供的迭代器函數來偵測資料庫中的元素 */
	detect(iterator: (item: T, index?: number, array?: T[]) => boolean): boolean;
}

declare interface String {
	/** 使用給定的替換字串替換匹配到的子字串 */
	gsub(pattern: RegExp | string, replacement: string): string;
	/** 去除字串兩端的空白字元 */
	strip(): string;
	/** 檢查字串是否給定的模式開頭 */
	startsWith(pattern: string): boolean;
	/** 檢查字串是否以給定的模式結尾 */
	endsWith(pattern: string): boolean;
}

// 定義 Ajax 物件及其方法（這裡只是宣告存在，沒有具體實作）
declare const Ajax: {
	Updater: any; // 需要具體實作詳細的類型定義
	Request: any; // 需要具體實作詳細的類型定義
};


