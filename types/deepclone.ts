export function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
        const newArr = [];
        for (let i = 0; i < obj.length; i++) {
            newArr[i] = deepCopy(obj[i]);
        }
        return newArr as any;
    }

    if (obj instanceof Object) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = deepCopy(obj[key]);
            }
        }
        return newObj as any;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}
