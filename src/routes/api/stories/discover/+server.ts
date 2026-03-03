import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discoverStories } from '$lib/server/discover';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const storage = platform?.env?.STORAGE;
	const anthropicKey = platform?.env?.ANTHROPIC_API_KEY;
	const googleKey = platform?.env?.GOOGLE_API_KEY;
	const braveKey = platform?.env?.BRAVE_API_KEY;

	if (!db) return json({ error: 'Database not available' }, { status: 503 });
	if (!anthropicKey) return json({ error: 'Anthropic API key not configured' }, { status: 503 });
	if (!braveKey) return json({ error: 'Brave Search API key not configured' }, { status: 503 });

	let categories: string[] | undefined;
	let count: number | undefined;
	try {
		const body = await request.json();
		categories = body.categories;
		count = body.count;
	} catch {
		// empty body is fine — use defaults
	}

	try {
		const result = await discoverStories({
			db,
			storage,
			anthropicKey,
			googleKey,
			braveKey,
			categories,
			count: count || 1
		});

		return json(result, { status: 201 });
	} catch (err) {
		console.error('Discover error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Discovery failed' },
			{ status: 500 }
		);
	}
};
