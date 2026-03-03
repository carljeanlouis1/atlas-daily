import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PAGE_SIZE } from '$lib/constants';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const category = url.searchParams.get('category');
	const search = url.searchParams.get('search');
	const limit = parseInt(url.searchParams.get('limit') || String(PAGE_SIZE));
	const offset = parseInt(url.searchParams.get('offset') || '0');

	let query = 'SELECT * FROM stories';
	const params: string[] = [];
	const conditions: string[] = [];

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
	if (!apiKey || apiKey !== platform?.env?.API_KEY) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const story = await request.json();
	const id = story.id || crypto.randomUUID();

	await db
		.prepare(
			`INSERT INTO stories (id, title, summary, body, category, image_url, audio_url, source, source_url, published_at, read_time)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
			story.read_time || 5
		)
		.run();

	return json({ id }, { status: 201 });
};
