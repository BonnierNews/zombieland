import FSCache from './fs-cache.js';
import isPath from './is-path.js';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const entryCode = `
	import * as exports from "wichita:source";
	import.meta.export(exports);
`;
const fsCache = new FSCache();

export default class Module {
	identifier = 'wichita:code';
	code = '';

	constructor (...args) {
		if (args.length === 2) {
			this.identifier = args[0];
			this.code = args[1];
		}
		else if (isPath(args[0])) {
			this.identifier = args[0];
			this.code = fsCache.get(this.identifier);
		}
		else {
			this.code = args[0];
		}
	}

	async evaluate (context = {}) {
		let exports = undefined;
		const module = new vm.SourceTextModule(entryCode, {
			identifier: 'wichita:entry',
			context: vm.isContext(context) ? context : vm.createContext(context),
			initializeImportMeta (meta) {
				meta.export = values => exports = values;
			}
		});
		await module.link(this.#entryLink.bind(this));
		await module.evaluate();
		return exports;
	}

	async #entryLink (specifier, referencingModule) {
		const code = String(await this.code);
		const module = new vm.SourceTextModule(code, {
			identifier: this.identifier,
			context: referencingModule.context,
			importModuleDynamically: Module.#link,
		});
		await module.link(Module.#link);
		return module;
	}

	static async #link (specifier, referencingModule) {
		const [ identifier, code ] = await Module.#resolveFile(specifier, referencingModule);
		const module = new vm.SourceTextModule(code, {
			context: referencingModule.context,
			identifier: identifier,
			importModuleDynamically: Module.#link,
		});
		await module.link(Module.#link);
		return module;
	}

	static async #resolveFile (specifier, referencingModule) {
		try {
			const identifier = referencingModule ?
				path.resolve(path.dirname(referencingModule.identifier), specifier) :
				url.fileURLToPath(import.meta.resolve(specifier));

			const file = await fsCache.get(identifier);
			return [ identifier, file ];
		}
		catch (error) {
			if (!referencingModule) throw error;
			return Module.#resolveFile(specifier);
		}
	}
}


// function resolveFile (specifier, referencingModule) {
// 	return [
// 		path.resolve(path.dirname(referencingModule.identifier), specifier),
// 		import.meta.resolve(specifier),
// 	].reduce((pendingFile, identifier) => {
// 		return pendingFile
// 			.catch(() => fs.readFile(identifier, { encoding: 'utf8' }));
// 	}, Promise.reject());
// }

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
