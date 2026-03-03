import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkDuplicate, computeHash } from '$lib/server/dedup';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const { stories } = await request.json();
	if (!Array.isArray(stories)) {
		return json({ error: 'stories must be an array' }, { status: 400 });
	}

	const stmt = db.prepare(
		`INSERT INTO stories (id, title, summary, body, category, image_url, audio_url, source, source_url, published_at, read_time, content_hash, input_type, original_input)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const inserted: string[] = [];
	const skipped: Array<{ title: string; reason: string }> = [];

	for (const story of stories) {
		const dupCheck = await checkDuplicate(db, story.title, story.source_url || null);
		if (dupCheck.isDuplicate) {
			skipped.push({ title: story.title, reason: dupCheck.reason || 'Duplicate' });
			continue;
		}

		const id = story.id || crypto.randomUUID();
		const contentHash = await computeHash(story.title + (story.source_url || ''));

		await stmt
			.bind(
				id,
				story.title,
				story.summary,
				story.body,
				story.category,
				story.image_url || null,
				story.audio_url || null,
				story.source,
				story.source_url || null,
				story.published_at || new Date().toISOString(),
				story.read_time || 5,
				contentHash,
				story.input_type || null,
				story.original_input || null
			)
			.run();

		inserted.push(id);
	}

	return json({ inserted: inserted.length, skipped, ids: inserted }, { status: 201 });
};
