import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discoverStories } from '$lib/server/discover';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const storage = platform?.env?.STORAGE;
	const anthropicKey = platform?.env?.ANTHROPIC_API_KEY;
	const googleKey = platform?.env?.GOOGLE_API_KEY;
	const braveKey = platform?.env?.BRAVE_API_KEY;
	const xaiKey = platform?.env?.XAI_API_KEY;
	const cronSecret = platform?.env?.CRON_SECRET;

	if (!db) return json({ error: 'Database not available' }, { status: 503 });
	if (!anthropicKey) return json({ error: 'Anthropic API key not configured' }, { status: 503 });
	if (!braveKey) return json({ error: 'Brave Search API key not configured' }, { status: 503 });

	// Auth: accept either CRON_SECRET or ATLAS_DAILY_API_KEY
	const reqSecret = request.headers.get('X-Cron-Secret');
	const reqKey = request.headers.get('X-API-Key');
	const apiKey = platform?.env?.ATLAS_DAILY_API_KEY;

	const authorized =
		(cronSecret && reqSecret === cronSecret) ||
		(apiKey && reqKey === apiKey);

	if (!authorized) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await discoverStories({
			db,
			storage,
			anthropicKey,
			googleKey,
			braveKey,
			xaiKey,
			count: 2 // 2 per category = up to 14 total
		});

		return json(result, { status: 201 });
	} catch (err) {
		console.error('Auto-discover error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Auto-discovery failed' },
			{ status: 500 }
		);
	}
};
