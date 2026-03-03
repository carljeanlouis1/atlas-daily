import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return { topics: [] };
	}

	const result = await db
		.prepare(
			`SELECT category, COUNT(*) as count,
			 MAX(published_at) as latest_published,
			 (SELECT title FROM stories s2 WHERE s2.category = s1.category ORDER BY published_at DESC LIMIT 1) as latest_title
			 FROM stories s1 GROUP BY category ORDER BY count DESC`
		)
		.all();

	return {
		topics: result.results || []
	};
};
