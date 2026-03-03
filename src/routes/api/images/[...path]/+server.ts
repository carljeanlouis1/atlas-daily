import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const storage = (platform?.env as any)?.STORAGE;
	if (!storage) throw error(500, 'Storage not configured');

	const obj = await storage.get(params.path);
	if (!obj) throw error(404, 'Image not found');

	const headers = new Headers();
	headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/png');
	headers.set('Cache-Control', 'public, max-age=31536000');

	return new Response(obj.body, { headers });
};
