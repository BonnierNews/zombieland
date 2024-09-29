import fs from 'node:fs/promises';
import isPath from './is-path.js';
import path from 'node:path';
import vm from 'node:vm';

const entryCode = `
	import * as exports from "wichita:source";
	_wichita.exports = exports;
`;

export default class Module {
	#identifier = 'wichita:code';
	#code;

	constructor (source) {
		if (isPath(source)) {
			this.#identifier = source;
			this.#code = fs.readFile(source, { encoding: 'utf8' });
		}
		else {
			this.#code = source;
		}
	}

	async evaluate (context = {}) {
		// eslint-disable-next-line no-underscore-dangle
		const wichita = context._wichita = { exports: undefined };
		const module = new vm.SourceTextModule(entryCode, {
			identifier: 'wichita:entry',
			context: vm.isContext(context) ? context : vm.createContext(context),
		});
		await module.link(this.#entryLink.bind(this));
		await module.evaluate();
		return wichita.exports;
	}

	async #entryLink (specifier, referencingModule) {
		const code = await this.#code;
		const module = new vm.SourceTextModule(code, {
			identifier: this.#identifier,
			context: referencingModule.context,
			importModuleDynamically: Module.#link,
		});
		await module.link(Module.#link);
		return module;
	}

	static async #link (specifier, referencingModule) {
		const identifier = path.resolve(path.dirname(referencingModule.identifier), specifier);
		const code = await fs.readFile(identifier, { encoding: 'utf8' });
		const module = new vm.SourceTextModule(code, {
			context: referencingModule.context,
			identifier: identifier,
			importModuleDynamically: Module.#link,
		});
		await module.link(Module.#link);
		return module;
	}
}

// export class Module {
// 	constructor (pendingCode, identifier) {
// 		this.pendingCode = pendingCode;
// 		this.identifier = identifier;
// 	}

// 	async evaluate (context) {
// 		const code = await this.pendingCode;
// 		console.log(code, context);
// 		const module = new vm.SourceTextModule(code.toString(), {
// 			identifier: this.identifier,
// 			context: vm.isContext(context) ? context : vm.createContext(context),
// 			importModuleDynamically: Module.#link,
// 		});
// 		await module.link(Module.#link);
// 		return module.evaluate();
// 	}

// 	static #link (specifier, referencingModule) {
// 		const childPath = path.resolve(path.dirname(referencingModule.identifier), specifier);
// 		// if (!childPath.endsWith(".mjs"))
// 		//   childPath = childPath + ".js";
// 		return new Module(fs.readFile(childPath), childPath, referencingModule.context);
// 	}
// }

// async function Module (pendingCode, context, identifier) {
// 	const code = await pendingCode;
// 	const mod = new vm.SourceTextModule(code.toString(), {
// 		context,
// 		identifier,
// 		importModuleDynamically: link,
// 	});
// 	await mod.link(link);
// 	return mod;
// }

// async function link (specifier, referencingModule) {
// 	const childPath = path.resolve(path.dirname(referencingModule.identifier), specifier);
// 	// if (!childPath.endsWith(".mjs"))
// 	//   childPath = childPath + ".js";
// 	return Module(fs.readFile(childPath), referencingModule.context, childPath);
// }
