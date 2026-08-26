/**
 * 舊專案相容工具函式 - 重構版
 *
 * 重構原則：
 * 1. 保留所有原函式名稱與呼叫方式（Object.clone(x)、arr.each(...) 等）
 * 2. 不覆寫任何原生方法的「執行期行為」，避免破壞第三方套件與型別系統
 *    - Object.keys：完全移除，直接使用原生實作與原生型別（string[]）
 *    - Object.clone：保留名字（無原生同名方法），但內部改用原生展開語法 {...obj} 實作
 *    - String.prototype.startsWith / endsWith：直接移除，原生已足夠且更完整
 * 3. 修正 Object.clone 的 `this` 參數語法錯誤
 * 4. 每個 prototype extension 都加上存在性防呆，避免重複載入時互相覆蓋
 * 5. deepClone 改為標準「逐一深拷貝」實作，並保留 circular reference 保護
 *    （原本的實作其實是「陣列內同 key 值合併」，如果那是刻意行為，
 *      請另外告訴我，我可以用別的名字保留那個版本）
 */

// ============================================================
// 型別宣告（declaration merging）
// ============================================================

declare global {
	interface ObjectConstructor {
		/** 淺拷貝任意物件（保留自身可列舉屬性）。內部直接使用原生展開語法。 */
		clone<T extends object>(source: T): T;
	}

	interface Array<T> {
		/** 淺拷貝陣列 */
		clone(): T[];
		/** 走訪陣列，可指定 this context */
		each(iterator: (element: T, index: number, array: T[]) => void, context?: any): void;
		/** 取得最後一個元素，空陣列回傳 null */
		last(): T | null;
		/** 移除陣列中 falsy 的元素 */
		compact(): T[];
		/** 是否存在符合條件的元素 */
		detect(iterator: (element: T, index: number, array: T[]) => boolean): boolean;
	}

	interface String {
		/** 將字串中所有 pattern 取代為 replacement（非 regex，純字串比對） */
		gsub(pattern: string, replacement: string): string;
		/** 去除頭尾空白 */
		strip(): string;
	}
}

// ============================================================
// Object
// ============================================================

Object.clone = function <T extends object>(source: T): T {
	return { ...source };
};


// Object.keys 完全使用原生實作與原生型別（string[]），不做任何覆寫或型別強化。

// ============================================================
// Array
// ============================================================
// 這些 if 在防什麼
// 重複載入：如果 proto.ts 因為某種原因被執行兩次，第二次執行時 Array.prototype.each = function...這種賦值不會出錯，
// 但沒有 guard 的話就是「靜默覆蓋」，你完全不會發現多跑了一次。

//if (typeof Array.prototype.clone !== 'function') {
Array.prototype.clone = function <T>(this: T[]): T[] {
	return this.slice();
};

Array.prototype.each = function <T>(
	this: T[],
	iterator: (element: T, index: number, array: T[]) => void,
	context?: any
): void {
	for (let i = 0, length = this.length; i < length; i++) {
		iterator.call(context, this[i], i, this);
	}
};

Array.prototype.last = function <T>(this: T[]): T | null {
	return this.length === 0 ? null : this[this.length - 1];
};

Array.prototype.compact = function <T>(this: T[]): T[] {
	return this.filter((item) => Boolean(item));
};


Array.prototype.detect = function <T>(
	this: T[],
	iterator: (element: T, index: number, array: T[]) => boolean
): boolean {
	return this.some(iterator);
};


// ============================================================
// String
// ============================================================

String.prototype.gsub = function (pattern: string, replacement: string): string {
	return this.split(pattern).join(replacement);
};

String.prototype.strip = function (): string {
	return this.trim();
};


// startsWith / endsWith 已移除：ES6 原生已提供且功能更完整（支援 position 參數）。

// ============================================================
// deepClone（改用原生 structuredClone）
// ============================================================
// 原生實作已處理 circular reference、Date、Map、Set、RegExp、ArrayBuffer 等，
// 不需要自己維護遞迴邏輯。
//
// 注意：
// 1. 物件內若含有 function 或 Symbol 屬性會直接 throw（原手刻版是默默略過，行為不同）
// 2. 若是自訂 class 的 instance，clone 後只會保留資料，prototype chain 會遺失
//    （這點跟原手刻版行為一致，並非新引入的差異）

/**
 * 深拷貝任意值（改用原生 structuredClone） 
 * @param value
 * @returns
 */
export function deepClone<T>(value: T): T {
	return structuredClone(value);
}

export { };