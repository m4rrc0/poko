import deepmerge from 'deepmerge';
import Downloader from 'nodejs-file-downloader';
import StreamZip from 'node-stream-zip';
import _set from 'lodash.set';

export { notionHelpers } from './notionHelpers.mjs';
export * as pokoHelpers from './pokoHelpers.mjs';

export function slugify(string) {
	const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
	const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
	const p = new RegExp(a.split('').join('|'), 'g');

	return string
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w\-]+/g, '') // Remove all non-word characters
		.replace(/\-\-+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

export const slugifyPath = (codeName) => {
	if (!codeName) return { slug: undefined, path: undefined };

	const pathAsArray = codeName
		.split('/') // keep '/' in the names of the pages
		.map(slugify) // slugify (and remove leading and trailing spaces, etc)
		.filter((el) => el !== ''); // remove leading and trailing '/' (and empty path sections between 2 '/')

	const slug = pathAsArray[pathAsArray.length - 1];
	const path = pathAsArray.join('/');

	if (path === 'index') return { slug: '', path: '' };

	return { slug, path };
};

// export const joinStrings = (arr, separator = ' ') => arr.filter((z) => z).join(separator);
export const mergeClasses = (arr, separator = ' ') =>
	arr.filter((z) => typeof z === 'string' && z).join(separator);

export function isObject(variable) {
	return Object.prototype.toString.call(variable) === '[object Object]';
}
// export function isObject(obj) {
// 	return !!obj && obj.constructor === Object;
// }

// Michmach from https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6
// Spread from https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6?permalink_comment_id=3585151#gistcomment-3585151
// Recrurse from https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6?permalink_comment_id=3257606#gistcomment-3257606
function deepMergeInner(target, source) {
	const result = { ...target, ...source };
	const keys = Object.keys(result);

	for (const key of keys) {
		const targetValue = target[key];
		const sourceValue = source[key];

		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			result[key] = targetValue.concat(sourceValue);
		} else if (isObject(targetValue) && isObject(sourceValue)) {
			// result[key] = deepMergeInner(targetValue, sourceValue);
			result[key] = deepMergeInner(Object.assign({}, targetValue), sourceValue);
		}
	}

	return result;
}
export function simpleDeepMerge(..._objects) {
	let objects = [..._objects];

	if (objects.length < 2) {
		// Maybe we passed an array instead of a list of objects
		if (Array.isArray(objects[0])) simpleDeepMerge(...objects[0]);
		else return objects[0];
	}

	if (objects.some((object) => !isObject(object))) {
		throw new Error('deepMerge: all values should be of type "object"');
	}

	const target = objects.shift();
	let source;

	while ((source = objects.shift())) {
		deepMergeInner(target, source);
	}

	return target;
}

export const parseFileUrl = (url) => {
	if (typeof url !== 'string') return { filename: null, extension: null };

	const parts = url.split('/');
	const last = parts[parts.length - 1];
	const filename = last.split('?')[0];
	const filenameSplit = filename.split('.');
	const extension = '.' + filenameSplit[filenameSplit.length - 1];

	return { filename, extension };
};

export function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const deepMergePropsSelf = (_arrOfPropsObj) => {
	const arrOfPropsObj = _arrOfPropsObj.map((propsObj) => {
		for (const key in propsObj) {
			// Remove prop if null or undefined because it could overwrite some previous part of the merge
			if (propsObj[key] == null) {
				delete propsObj[key];
			}
			// Expand dot notation keys (only first level) before merging
			if (/\./.test(key)) {
				const val = propsObj[key];
				delete propsObj[key];
				_set(propsObj, key, val);
			}
		}
		return propsObj;
	});

	return deepmerge.all(arrOfPropsObj);
	// const { self, ...props } = deepmerge.all(arrOfPropsObj);
	// return {
	//   ...props,
	//   self: deepmerge(self || {}, props || {}),
	// };
};

export const deepMergePropsAllPages = (_arrOfAncestorsProps) => {
	if (!Array.isArray(_arrOfAncestorsProps)) {
		throw 'Trying to merge array of props but not an array';
	}
	if (_arrOfAncestorsProps.length === 0) {
		console.error('You are trying to merge props from an empty array');
		return {};
	}
	if (_arrOfAncestorsProps.length === 1) {
		// These are only the settings
		return {
			..._arrOfAncestorsProps[0],
			// page: deepMergePropsSelf([_arrOfAncestorsProps[0].page])
		};
	}

	let prev_children = {};
	// TODO: merge _self into props BUT remove what were passed from parents' _self ??
	// let prev_self = undefined;
	const arrOfProps = _arrOfAncestorsProps
		// .filter((p) => p.title) // remove non-pages from the list
		.map((propsObj, i, arr) => {
			const { role } = propsObj.poko.page; // To match subPages targets
			const self = propsObj.page.self;

			const isSettings = i === 0;
			const isSelf = i === arr.length - 1;

			const {
				raw,
				// self,
				_self,
				_page,
				_children,
				subPages,
				title,
				// href,
				metadata,
				jsonld,
				components,
				...restProps
			} = self;

			const fromPrevChildren = {
				...prev_children?.all,
				...prev_children?.[role],
			};

			const propsPageMerged = deepmerge.all([
				{ ...fromPrevChildren }, // merge the _children prop from a parent
				(isSettings || isSelf) && metadata ? { metadata } : {}, // only merge current metadata with the global ones from settings
				(isSettings || isSelf) && jsonld ? { jsonld } : {}, // only merge current jsonld with the global ones from settings
				// these next props are not merged. Only keep the value of the current page.
				isSelf && raw ? { raw } : {},
				isSelf && self ? { self } : {},
				isSelf && _self ? { _self } : {},
				isSelf && _page ? { _page } : {},
				isSelf && _children ? { _children } : {},
				isSelf && subPages ? { subPages } : {},
				// isSelf && href ? { href } : {},
				// isSelf && title ? { title } : {},
				// Everything else is merged
				typeof title !== 'undefined' ? { title } : {},
				restProps,
				isSelf && _self ? { ..._self } : {},
			]);

			const possibleComponentsAdded = Object.entries(propsPageMerged).reduce(
				(prev, [key, val]) => {
					const isFunction = typeof val === 'function';
					// Any component except "style" and "title" which are important keywords in poko and not to be replaced anyway
					const hasCompName =
						typeof val === 'string' &&
						/^[A-Z]|^wrapper$|^a$|^abbr$|^address$|^area$|^article$|^aside$|^audio$|^b$|^base$|^bdi$|^bdo$|^blockquote$|^body$|^br$|^button$|^canvas$|^caption$|^cite$|^code$|^col$|^colgroup$|^data$|^datalist$|^dd$|^del$|^details$|^dfn$|^dialog$|^div$|^dl$|^dt$|^em$|^embed$|^fieldset$|^figcaption$|^figure$|^footer$|^form$|^h1$|^h2$|^h3$|^h4$|^h5$|^h6$|^head$|^header$|^hr$|^html$|^i$|^iframe$|^img$|^input$|^ins$|^kbd$|^label$|^legend$|^li$|^link$|^main$|^map$|^mark$|^meta$|^meter$|^nav$|^noscript$|^object$|^ol$|^optgroup$|^option$|^output$|^p$|^param$|^picture$|^pre$|^progress$|^q$|^rp$|^rt$|^ruby$|^s$|^samp$|^script$|^section$|^select$|^small$|^source$|^span$|^strong$|^sub$|^summary$|^sup$|^svg$|^table$|^tbody$|^td$|^template$|^textarea$|^tfoot$|^th$|^thead$|^time$|^tr$|^track$|^u$|^ul$|^var$|^video$|^wbr$/.test(
							key
						);

					const next = isFunction || hasCompName ? { [key]: val } : {};
					return { ...prev, ...next };
				},
				{
					...(propsPageMerged?.components || {}),
					...components,
				}
			);

			prev_children = deepmerge(prev_children, subPages || _children || {});

			return {
				...propsObj,
				page: {
					...propsPageMerged,
					components: possibleComponentsAdded,
				},
			};
			// return { ...propsPageMerged, components: possibleComponentsAdded };
		});

	return deepmerge.all(arrOfProps);
};

export const probeFile = async (fileObject) => {
	try {
		const { url: _, ...probe } = await probeImageSize(fileObject.originalUrl);
		// console.log({ probe });
		return { ...fileObject, ...probe };
	} catch (error) {
		// console.error(error);
		return fileObject;
	}
};

export const probeHeaders = async (fileObject) => {
	try {
		const _f = await fetch(fileObject.originalUrl);
		const headers = await _f.headers;
		const length = headers.get('content-length');
		const mime = headers.get('content-type');
		const etag = headers.get('etag');
		const _last_modified = headers.get('last-modified');
		const last_modified = new Date(_last_modified).toISOString();
		// console.log({ length, mime, etag, last_modified });

		return { ...fileObject, length, mime, etag, last_modified };
	} catch (error) {
		return fileObject;
	}
};

export async function downloadFile(fileObject, systemFile) {
	const { originalUrl, filename, extension, url } = fileObject;
	// const projectPathToFile = url.replace("/", "public/");
	// const systemPathToFile = `${process.cwd()}/${projectPathToFile}`;
	// const projectPathToFile = `${projectPathToDownloadDir}/${filename}`;
	const systemDir = systemFile.replace(`/${filename}`, '');
	// console.log({ systemFile, systemDir });

	const downloader = new Downloader({
		url: originalUrl, //If the file name already exists, a new file with the name followed by '1' is created.
		directory: systemDir, //This folder will be created, if it doesn't exist.
		fileName: filename,
		// cloneFiles: false, //This will cause the downloader to re-write an existing file.
		skipExistingFileName: true, // completely skip downloading a file, when a file with the same name already exists
		maxAttempts: 3,
	});
	try {
		await downloader.download(); //Downloader.download() returns a promise.

		console.info(`File ${filename} downloaded successfully.`);
	} catch (err) {
		//IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
		//Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
		console.error(`Error writing stream for file ${filename}.\n`, err);
	}
}

export async function extractZip(fileObject, systemFile) {
	const { originalUrl, filename, extension, url } = fileObject;
	// const projectPathToFile = url.replace("/", "public/");
	// const systemFile = `${process.cwd()}/${projectPathToFile}`;
	const systemDir = systemFile.replace(`/${filename}`, '');

	// Async version
	const zip = new StreamZip.async({ file: systemFile });
	const count = await zip.extract(null, systemDir);
	console.info(`Extracted ${count} entries from ${filename}`);

	zip.on('error', (err) => {
		console.error(`Error unziping file ${filename}.\n`, err);
	});

	await zip.close();
}

export const computeDataFromHelper = ({ function: funcName, ...params }) => {
	if (typeof funcName !== 'string') {
		console.error('Non string passed as helper function call');
		return undefined;
	}
	const func = params.poko.helpers?.[funcName];
	// console.log({ func });
	return typeof func === 'function' ? func(params) : {};
};
