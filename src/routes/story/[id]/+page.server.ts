import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Story } from '$lib/types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(503, 'Database not available');

	const story = await db.prepare('SELECT * FROM stories WHERE id = ?').bind(params.id).first();
	if (!story) throw error(404, 'Story not found');

	const related = await db
		.prepare('SELECT * FROM stories WHERE category = ? AND id != ? ORDER BY published_at DESC LIMIT 4')
		.bind(story.category as string, params.id)
		.all();

	return {
		story: story as unknown as Story,
		related: (related.results as unknown as Story[]) || []
	};
};
