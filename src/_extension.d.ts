// string-ext.d.ts
//declare global__ {
declare interface String {
	/**
	 * Converts string to number with enhanced parsing capabilities
	 * - Supports hex(0x), binary(0b), octal(0o) prefixes
	 * - Handles scientific notation (1.23e4)
	 * - Automatic trim and whitespace removal
	 * - Graceful handling of trailing characters
	 * @returns Parsed number or NaN
	 */
	toNumber(options?: NumberConversionOptions): number;
}


//}

//export { }; // Important for module augmentation
// 定义一个全局的扩展对象，假设这些扩展是挂载在全局对象上的
//declare global {
declare interface Object {
	/** 克隆对象 */
	clone<T>(this: T): T;
	/** 获取对象的所有可枚举属性键 */
	keys<T>(this: T): Array<keyof T>;
}

declare interface Array<T> {
	/** 克隆数组 */
	clone(): T[];
	/** 对数组中的每个元素执行迭代器函数 */
	each(iterator: (item: T, index?: number, array?: T[]) => void, context?: any): void;
	/** 获取数组的最后一个元素 */
	last(): T | null;
	/** 返回一个新数组，该数组包含原数组中的所有非假值元素 */
	compact(): T[];
	/** 使用提供的迭代器函数检测数组中的元素 */
	detect(iterator: (item: T, index?: number, array?: T[]) => boolean): boolean;
}

declare interface String {
	/** 使用给定的替换字符串替换匹配到的子字符串 */
	gsub(pattern: RegExp | string, replacement: string): string;
	/** 去除字符串两端的空白字符 */
	strip(): string;
	/** 检查字符串是否以给定的模式开头 */
	startsWith(pattern: string): boolean;
	/** 检查字符串是否以给定的模式结尾 */
	endsWith(pattern: string): boolean;
}

// 定义 Ajax 对象及其方法（这里只是声明存在，没有具体实现）
declare const Ajax: {
	Updater: any; // 需要具体实现或更详细的类型定义
	Request: any; // 需要具体实现或更详细的类型定义
};
//}


