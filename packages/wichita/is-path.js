import path from 'node:path';

export default function isPath (pathname) {
	return pathname === encodeURI(pathname) &&
		!!path.extname(pathname);
}
