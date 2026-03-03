import type { PageServerLoad } from './$types';
import type { Story } from '$lib/types';
import { PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return { stories: [] as Story[] };
	}

	const category = url.searchParams.get('category');
	let query = 'SELECT * FROM stories';
	const params: string[] = [];

	if (category && category !== 'all') {
		query += ' WHERE category = ?';
		params.push(category);
	}

	query += ' ORDER BY published_at DESC LIMIT ?';
	params.push(String(PAGE_SIZE));

	const result = await db.prepare(query).bind(...params).all();
	return { stories: (result.results as unknown as Story[]) || [] };
};
