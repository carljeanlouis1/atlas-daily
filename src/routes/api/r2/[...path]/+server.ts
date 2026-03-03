import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const storage = platform?.env?.STORAGE;
	if (!storage) {
		return new Response('Storage not available', { status: 503 });
	}

	const object = await storage.get(params.path);
	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const headers = new Headers();
	headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(object.body, { headers });
};
