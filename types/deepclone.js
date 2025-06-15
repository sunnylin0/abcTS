

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
	grea: [{c:3,b:3}],
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
	grea: [{ a: 12, b: 13 }],
	pitch: {
		name: "g",
		acc: "double"
	}
}

const d = deepClone([a, b, c]);
console.log(d)