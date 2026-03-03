import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const migrations = [
		'ALTER TABLE stories ADD COLUMN content_hash TEXT',
		'ALTER TABLE stories ADD COLUMN input_type TEXT',
		'ALTER TABLE stories ADD COLUMN original_input TEXT',
		'CREATE INDEX IF NOT EXISTS idx_stories_content_hash ON stories(content_hash)'
	];

	const results: string[] = [];
	for (const sql of migrations) {
		try {
			await db.prepare(sql).run();
			results.push(`OK: ${sql}`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg.includes('duplicate column') || msg.includes('already exists')) {
				results.push(`SKIP (exists): ${sql}`);
			} else {
				results.push(`ERR: ${sql} — ${msg}`);
			}
		}
	}

	return json({ results });
};
