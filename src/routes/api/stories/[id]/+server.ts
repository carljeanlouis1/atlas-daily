import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const story = await db.prepare('SELECT * FROM stories WHERE id = ?').bind(params.id).first();

	if (!story) {
		return json({ error: 'Story not found' }, { status: 404 });
	}

	return json(story);
};
