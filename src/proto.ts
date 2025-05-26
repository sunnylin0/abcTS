

Object.clone = function <T>(this, source: T): T {
	const destination = {} as T;
	for (const property in source) {
		if (source.hasOwnProperty(property)) {
			(destination as any)[property] = (source as any)[property];
		}
	}
	return destination;
};

Object.keys = function <T>(object: T): Array<keyof T> {
	const keys: Array<keyof T> = [];
	for (const property in object) {
		if (object.hasOwnProperty(property)) {
			keys.push(property as keyof T);
		}
	}
	return keys;
};


Array.prototype.clone = function <T>(): T[] {
	const destination = [] as T[];
	for (let i = 0; i < this.length; i++) {
		destination.push(this[i] as T);
	}
	return destination;
};

Array.prototype.each = function <T>(this: T[], iterator: (element: T, index: number, array: T[]) => void, context?: any): void {
	for (let i = 0, length = this.length; i < length; i++) {
		iterator.call(context, this[i], i, this);
	}
};

Array.prototype.last = function <T>(this: T[]): T | null {
	if (this.length === 0) {
		return null;
	}
	return this[this.length - 1] as T;
};

Array.prototype.compact = function <T>(this: T[]): T[] {
	const output: T[] = [] as T[];
	for (let i = 0; i < this.length; i++) {
		if (this[i] as any) { // any used here to avoid compile error due to unknown truthiness of T
			output.push(this[i] as T);
		}
	}
	return output;
};

Array.prototype.detect = function <T>(this: T[], iterator: (element: T, index: number, array: T[]) => boolean): boolean {
	for (let i = 0; i < this.length; i++) {
		if (iterator(this[i], i, this)) {
			return true;
		}
	}
	return false;
};


String.prototype.gsub = function (pattern: string, replacement: string): string {
	return this.split(pattern).join(replacement);
};

String.prototype.strip = function (): string {
	return this.replace(/^\s+/, '').replace(/\s+$/, '');
};

String.prototype.startsWith = function (pattern: string): boolean {
	return this.indexOf(pattern) === 0;
};

String.prototype.endsWith = function (pattern: string): boolean {
	const d = this.length - pattern.length;
	return d >= 0 && this.lastIndexOf(pattern) === d;
};

const Ajax: AjaxObject = {
	Updater: function () { },
	Request: function () { }
};

function deepCloneOne(obj, hash = new WeakMap()) {
	if (obj === null || typeof obj !== 'object') return obj;
	if (hash.has(obj)) return hash.get(obj);

	let clone = Array.isArray(obj) ? [] : {};
	hash.set(obj, clone);

	for (let key in obj) {
		if (obj.hasOwnProperty(key)) {
			clone[key] = deepClone(obj[key], hash);
		}
	}
	return clone;
}

function deepClone(obj, hash = new WeakMap()) {
	if (!Array.isArray(obj)) return deepCloneOne(obj);
	let valList;
	let classList = []
	for (let o of obj) {
		if (o === null) {
		} else if (typeof o !== 'object') {
			valList = o;
		} else {
			classList.push(o);
		}
	}

	let clone = Array.isArray(obj) ? [] : {};
	let cloneList = {}

	if (classList.length === 0) return valList;

	for (let o of obj) {
		for (let key in o) {
			if (o.hasOwnProperty(key)) {
				if (!cloneList[key]) cloneList[key] = [];
				cloneList[key].push(o[key]);
			}
		}
	}

	for (let key in cloneList) {
		if (cloneList[key].length === 1) {
			clone[key] = deepCloneOne(cloneList[key][0]);
		} else {
			clone[key] = deepClone(cloneList[key])
		}
	}
	return clone;
}

let a = {
	elType: "bar",
	pitch: {
		name: "A",
		pos: 3,
	}
}

let b = {
	elType: "tempo",
	pitch: {
		name: "g",
		i: 3,
		ver: 3.5
	}
}
let c = {
	elType: "tempo",
	pitch: {
		name: "g",
		acc: "double"
	}
}

const d = deepClone([a, b, c]);
console.log(d)
