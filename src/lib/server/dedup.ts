export async function computeHash(text: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(text.toLowerCase().trim());
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function similarityScore(a: string, b: string): number {
	const aLower = a.toLowerCase().trim();
	const bLower = b.toLowerCase().trim();

	if (aLower === bLower) return 1;

	const aWords = new Set(aLower.split(/\s+/));
	const bWords = new Set(bLower.split(/\s+/));

	let intersection = 0;
	for (const word of aWords) {
		if (bWords.has(word)) intersection++;
	}

	const union = new Set([...aWords, ...bWords]).size;
	return union === 0 ? 0 : intersection / union;
}

export async function checkDuplicate(
	db: D1Database,
	title: string,
	sourceUrl: string | null
): Promise<{ isDuplicate: boolean; reason?: string }> {
	// Check content hash
	const hashInput = title + (sourceUrl || '');
	const hash = await computeHash(hashInput);

	const existing = await db
		.prepare('SELECT id, title FROM stories WHERE content_hash = ?')
		.bind(hash)
		.first();

	if (existing) {
		return { isDuplicate: true, reason: 'Exact duplicate detected (matching content hash)' };
	}

	// Fuzzy title check within last 7 days
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const recent = await db
		.prepare('SELECT id, title FROM stories WHERE published_at > ? ORDER BY published_at DESC LIMIT 100')
		.bind(sevenDaysAgo)
		.all();

	for (const row of recent.results || []) {
		const score = similarityScore(title, row.title as string);
		if (score > 0.8) {
			return {
				isDuplicate: true,
				reason: `Similar story found: "${row.title}" (${Math.round(score * 100)}% match)`
			};
		}
	}

	return { isDuplicate: false };
}
