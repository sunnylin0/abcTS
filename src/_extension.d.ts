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
