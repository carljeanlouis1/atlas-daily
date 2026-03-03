import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PAGE_SIZE } from '$lib/constants';
import { checkDuplicate, computeHash } from '$lib/server/dedup';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const category = url.searchParams.get('category');
	const search = url.searchParams.get('search');
	const limit = parseInt(url.searchParams.get('limit') || String(PAGE_SIZE));
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const ids = url.searchParams.get('ids');

	let query = 'SELECT * FROM stories';
	const params: string[] = [];
	const conditions: string[] = [];

	if (ids) {
		const idList = ids.split(',');
		conditions.push(`id IN (${idList.map(() => '?').join(',')})`);
		params.push(...idList);
	}

	if (category) {
		conditions.push('category = ?');
		params.push(category);
	}

	if (search) {
		conditions.push('(title LIKE ? OR summary LIKE ?)');
		params.push(`%${search}%`, `%${search}%`);
	}

	if (conditions.length > 0) {
		query += ' WHERE ' + conditions.join(' AND ');
	}

	query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
	params.push(String(limit), String(offset));

	const result = await db.prepare(query).bind(...params).all();
	return json({ stories: result.results, meta: { limit, offset } });
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const apiKey = request.headers.get('X-API-Key');
	if (!apiKey || apiKey !== platform?.env?.ATLAS_DAILY_API_KEY) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const story = await request.json();
	const id = story.id || crypto.randomUUID();

	// Dedup check
	const dupCheck = await checkDuplicate(db, story.title, story.source_url || null);
	if (dupCheck.isDuplicate) {
		return json({ error: dupCheck.reason, duplicate: true }, { status: 409 });
	}

	const contentHash = await computeHash(story.title + (story.source_url || ''));

	await db
		.prepare(
			`INSERT INTO stories (id, title, summary, body, category, image_url, audio_url, source, source_url, published_at, read_time, content_hash, input_type, original_input)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
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

	return json({ id }, { status: 201 });
};
