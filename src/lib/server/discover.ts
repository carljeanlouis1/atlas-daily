import { chatCompletion, generateImage } from './openai';
import { checkDuplicate, computeHash } from './dedup';
import { fetchUrlContent } from './extract';

const SEARCH_QUERIES: Record<string, string[]> = {
	ai: ['latest AI news today', 'artificial intelligence breakthroughs'],
	geopolitics: ['geopolitics news today', 'international relations developments'],
	politics: ['US politics news today', 'political developments'],
	tech: ['technology news today', 'tech industry'],
	markets: ['stock market news today', 'financial markets'],
	culture: ['culture news today', 'entertainment industry'],
	business: ['business news today', 'startups funding']
};

const SYSTEM_PROMPT = `You are a senior editorial writer for Atlas Daily, a premium personal intelligence briefing. Your writing style blends the analytical depth of The Information with the narrative flair of The New York Times and the opinionated edge of a smart newsletter writer.

Rules:
- Write in flowing, engaging prose — NOT bullet points or listicles
- Take a clear editorial stance — you have opinions and share them
- Open with a hook that makes the reader want to continue
- Provide context that connects this story to broader trends
- Include specific details, numbers, names — no vague generalities
- End with forward-looking analysis: what this means, what happens next
- Tone: intelligent, conversational, occasionally witty — like explaining to a brilliant friend over coffee
- Length: 800-1500 words depending on topic complexity
- Never use phrases like "In conclusion", "It remains to be seen", "Only time will tell"
- Never start with "In a world where..." or similar clichés

Output valid JSON only, no markdown code fences. Use this exact schema:
{
  "title": "Compelling headline (max 100 chars)",
  "summary": "2-3 sentence hook that captures the key insight (150-250 chars)",
  "body": "<p>Paragraph 1...</p><p>Paragraph 2...</p><p>Paragraph 3...</p><p>Paragraph 4...</p>",
  "category": "one of: ai, geopolitics, politics, culture, markets, tech, business",
  "source": "Original source name",
  "read_time": estimated_minutes_as_number,
  "image_prompt": "A prompt for generating an editorial news thumbnail: moody, cinematic, abstract representation of the topic. Dark tones, dramatic lighting, photojournalistic feel. No text or words in the image."
}`;

interface SearchResult {
	title: string;
	url: string;
	description: string;
}

async function braveSearch(query: string, braveKey: string, count: number = 5): Promise<SearchResult[]> {
	const res = await fetch(
		`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
		{
			headers: { 'X-Subscription-Token': braveKey }
		}
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Brave Search error (${res.status}): ${err}`);
	}

	const data = await res.json() as { web?: { results: Array<{ title: string; url: string; description: string }> } };
	return (data.web?.results || []).map((r) => ({
		title: r.title,
		url: r.url,
		description: r.description
	}));
}

interface DiscoverResult {
	id: string;
	title: string;
	category: string;
}

export async function discoverStories(options: {
	db: D1Database;
	storage?: R2Bucket;
	anthropicKey: string;
	googleKey?: string;
	braveKey: string;
	categories?: string[];
	count?: number;
}): Promise<{ created: DiscoverResult[]; skipped: string[] }> {
	const { db, storage, anthropicKey, googleKey, braveKey } = options;
	const categories = options.categories?.length ? options.categories : Object.keys(SEARCH_QUERIES);
	const countPerCategory = options.count || 1;

	const created: DiscoverResult[] = [];
	const skipped: string[] = [];

	for (const category of categories) {
		const queries = SEARCH_QUERIES[category];
		if (!queries) continue;

		// Pick a random query for variety
		const query = queries[Math.floor(Math.random() * queries.length)];

		let results: SearchResult[];
		try {
			results = await braveSearch(query, braveKey, 5);
		} catch (err) {
			skipped.push(`${category}: search failed — ${err instanceof Error ? err.message : 'unknown'}`);
			continue;
		}

		if (results.length === 0) {
			skipped.push(`${category}: no search results`);
			continue;
		}

		let generated = 0;
		for (const result of results) {
			if (generated >= countPerCategory) break;

			// Quick dedup on source URL
			const dupCheck = await checkDuplicate(db, result.title, result.url);
			if (dupCheck.isDuplicate) {
				skipped.push(`${category}: dup — ${result.title.slice(0, 60)}`);
				continue;
			}

			// Fetch article content
			let articleText: string;
			let sourceName: string;
			try {
				const content = await fetchUrlContent(result.url);
				articleText = `Article Title: ${content.title}\n\nContent: ${content.text}`;
				sourceName = content.siteName;
			} catch {
				// Fall back to search snippet
				articleText = `Article Title: ${result.title}\n\nDescription: ${result.description}`;
				sourceName = new URL(result.url).hostname.replace('www.', '');
			}

			// Generate article via Claude
			let article: {
				title: string;
				summary: string;
				body: string;
				category: string;
				source: string;
				read_time: number;
				image_prompt: string;
			};
			try {
				const raw = await chatCompletion(anthropicKey, SYSTEM_PROMPT, [
					{ type: 'text', text: `Write a full analytical article based on this content. Use category: ${category}\n\n${articleText}` }
				]);
				const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
				article = JSON.parse(cleaned);
				article.category = category;
				article.source = sourceName;
			} catch (err) {
				skipped.push(`${category}: generation failed — ${err instanceof Error ? err.message : 'unknown'}`);
				continue;
			}

			// Second dedup check on generated title
			const dupCheck2 = await checkDuplicate(db, article.title, result.url);
			if (dupCheck2.isDuplicate) {
				skipped.push(`${category}: dup after gen — ${article.title.slice(0, 60)}`);
				continue;
			}

			// Generate image
			let imageUrl: string | null = null;
			if (googleKey && storage) {
				try {
					const imageB64 = await generateImage(googleKey, article.image_prompt);
					const imageKey = `images/${crypto.randomUUID()}.png`;
					const imageBytes = Uint8Array.from(atob(imageB64), (c) => c.charCodeAt(0));
					await storage.put(imageKey, imageBytes, {
						httpMetadata: { contentType: 'image/png' }
					});
					imageUrl = `/api/r2/${imageKey}`;
				} catch {
					// Continue without image
				}
			}

			// Insert
			const storyId = crypto.randomUUID();
			const contentHash = await computeHash(article.title + result.url);
			const publishedAt = new Date().toISOString();

			await db
				.prepare(
					`INSERT INTO stories (id, title, summary, body, category, image_url, source, source_url, published_at, read_time, content_hash, input_type, original_input)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					storyId,
					article.title,
					article.summary,
					article.body,
					article.category,
					imageUrl,
					article.source,
					result.url,
					publishedAt,
					article.read_time || 5,
					contentHash,
					'discover',
					result.url
				)
				.run();

			created.push({ id: storyId, title: article.title, category });
			generated++;
		}
	}

	return { created, skipped };
}
