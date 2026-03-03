import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const apiKey = request.headers.get('X-API-Key');
	if (!apiKey || apiKey !== platform?.env?.API_KEY) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { stories } = await request.json();
	if (!Array.isArray(stories)) {
		return json({ error: 'stories must be an array' }, { status: 400 });
	}

	const stmt = db.prepare(
		`INSERT INTO stories (id, title, summary, body, category, image_url, audio_url, source, source_url, published_at, read_time)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const batch = stories.map((story) =>
		stmt.bind(
			story.id || crypto.randomUUID(),
			story.title,
			story.summary,
			story.body,
			story.category,
			story.image_url || null,
			story.audio_url || null,
			story.source,
			story.source_url || null,
			story.published_at || new Date().toISOString(),
			story.read_time || 5
		)
	);

	await db.batch(batch);
	return json({ inserted: stories.length }, { status: 201 });
};
