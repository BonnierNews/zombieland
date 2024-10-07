import fs from 'node:fs/promises';

export default class FSCache extends Map {
	get (key) {
		let value;
		if (!super.has(key)) {
			value = fs.readFile(key, { encoding: 'utf8' });
			super.set(key, value);
		}
		return value ?? super.get(key);
	}
}
