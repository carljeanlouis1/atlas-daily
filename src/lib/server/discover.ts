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
	source: 'x' | 'web' | 'submitted';
}

// --- X/Twitter search via xAI Grok ---

interface XTrend {
	topic: string;
	summary: string;
	sources: string;
}

async function searchXTwitter(category: string, xaiKey: string): Promise<XTrend[]> {
	const res = await fetch('https://api.x.ai/v1/responses', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${xaiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'grok-4-1-fast',
			stream: false,
			input: [
				{
					role: 'user',
					content: `What are the top 3 breaking or trending stories on X/Twitter right now about ${category}? For each, give me: the topic, a one-line summary, the key tweets/sources, and why it matters. Focus on the last 12 hours.

Return ONLY valid JSON, no markdown fences. Use this schema:
[{"topic": "...", "summary": "...", "sources": "key accounts/tweets discussing this"}]`
				}
			],
			tools: [{ type: 'x_search' }]
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`xAI API error (${res.status}): ${err}`);
	}

	const data = await res.json() as {
		output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
	};

	const msgOutput = data.output?.find((o: any) => o.type === 'message');
	const textContent = msgOutput?.content?.find((c: any) => c.type === 'text');
	const content = textContent?.text;
	if (!content) return [];

	try {
		const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleaned) as XTrend[];
	} catch {
		return [];
	}
}

// --- Brave web search ---

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
		description: r.description,
		source: 'web' as const
	}));
}

// --- Article generation helper ---

interface ArticleFields {
	title: string;
	summary: string;
	body: string;
	category: string;
	source: string;
	read_time: number;
	image_prompt: string;
}

async function generateArticle(
	anthropicKey: string,
	category: string,
	articleText: string,
	sourceName: string
): Promise<ArticleFields> {
	const raw = await chatCompletion(anthropicKey, SYSTEM_PROMPT, [
		{ type: 'text', text: `Write a full analytical article based on this content. Use category: ${category}\n\n${articleText}` }
	]);
	const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
	const article = JSON.parse(cleaned) as ArticleFields;
	article.category = category;
	article.source = sourceName;
	return article;
}

async function generateAndStoreImage(
	googleKey: string,
	storage: R2Bucket,
	imagePrompt: string
): Promise<string | null> {
	try {
		const imageB64 = await generateImage(googleKey, imagePrompt);
		const imageKey = `images/${crypto.randomUUID()}.png`;
		const imageBytes = Uint8Array.from(atob(imageB64), (c) => c.charCodeAt(0));
		await storage.put(imageKey, imageBytes, {
			httpMetadata: { contentType: 'image/png' }
		});
		return `https://pub-2049fec7caa24f8ebe3bc824e0ab04e5.r2.dev/${imageKey}`;
	} catch {
		return null;
	}
}

async function insertStory(
	db: D1Database,
	article: ArticleFields,
	imageUrl: string | null,
	sourceUrl: string | null,
	inputType: string,
	originalInput: string
): Promise<string> {
	const storyId = crypto.randomUUID();
	const contentHash = await computeHash(article.title + (sourceUrl || ''));
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
			sourceUrl,
			publishedAt,
			article.read_time || 5,
			contentHash,
			inputType,
			originalInput.slice(0, 2000)
		)
		.run();

	return storyId;
}

// --- Main discover orchestrator ---

export interface DiscoverResult {
	id: string;
	title: string;
	category: string;
	source: 'x' | 'web';
}

export async function discoverStories(options: {
	db: D1Database;
	storage?: R2Bucket;
	anthropicKey: string;
	googleKey?: string;
	braveKey: string;
	xaiKey?: string;
	categories?: string[];
	count?: number;
}): Promise<{ created: DiscoverResult[]; skipped: string[] }> {
	const { db, storage, anthropicKey, googleKey, braveKey, xaiKey } = options;
	const categories = options.categories?.length ? options.categories : Object.keys(SEARCH_QUERIES);
	const countPerCategory = options.count || 1;

	const created: DiscoverResult[] = [];
	const skipped: string[] = [];

	for (const category of categories) {
		let generated = 0;

		// --- Step 1: X/Twitter trends via Grok ---
		if (xaiKey && generated < countPerCategory) {
			try {
				const trends = await searchXTwitter(category, xaiKey);
				for (const trend of trends) {
					if (generated >= countPerCategory) break;

					// Dedup on topic
					const dupCheck = await checkDuplicate(db, trend.topic, null);
					if (dupCheck.isDuplicate) {
						skipped.push(`${category}/x: dup — ${trend.topic.slice(0, 60)}`);
						continue;
					}

					const articleText = `Trending topic on X/Twitter: ${trend.topic}\n\nSummary: ${trend.summary}\n\nKey sources: ${trend.sources}\n\nThis is currently trending in the ${category} space on X/Twitter.`;

					let article: ArticleFields;
					try {
						article = await generateArticle(anthropicKey, category, articleText, 'X / Twitter');
					} catch (err) {
						skipped.push(`${category}/x: gen failed — ${err instanceof Error ? err.message : 'unknown'}`);
						continue;
					}

					const dupCheck2 = await checkDuplicate(db, article.title, null);
					if (dupCheck2.isDuplicate) {
						skipped.push(`${category}/x: dup after gen — ${article.title.slice(0, 60)}`);
						continue;
					}

					const imageUrl = (googleKey && storage)
						? await generateAndStoreImage(googleKey, storage, article.image_prompt)
						: null;

					const storyId = await insertStory(db, article, imageUrl, null, 'x-trend', trend.topic);
					created.push({ id: storyId, title: article.title, category, source: 'x' });
					generated++;
				}
			} catch (err) {
				skipped.push(`${category}/x: search failed — ${err instanceof Error ? err.message : 'unknown'}`);
			}
		}

		// --- Step 2: Brave web search ---
		if (generated < countPerCategory) {
			const queries = SEARCH_QUERIES[category];
			if (!queries) continue;

			const query = queries[Math.floor(Math.random() * queries.length)];

			let results: SearchResult[];
			try {
				results = await braveSearch(query, braveKey, 5);
			} catch (err) {
				skipped.push(`${category}/web: search failed — ${err instanceof Error ? err.message : 'unknown'}`);
				continue;
			}

			if (results.length === 0) {
				skipped.push(`${category}/web: no search results`);
				continue;
			}

			for (const result of results) {
				if (generated >= countPerCategory) break;

				const dupCheck = await checkDuplicate(db, result.title, result.url);
				if (dupCheck.isDuplicate) {
					skipped.push(`${category}/web: dup — ${result.title.slice(0, 60)}`);
					continue;
				}

				let articleText: string;
				let sourceName: string;
				try {
					const content = await fetchUrlContent(result.url);
					articleText = `Article Title: ${content.title}\n\nContent: ${content.text}`;
					sourceName = content.siteName;
				} catch {
					articleText = `Article Title: ${result.title}\n\nDescription: ${result.description}`;
					sourceName = new URL(result.url).hostname.replace('www.', '');
				}

				let article: ArticleFields;
				try {
					article = await generateArticle(anthropicKey, category, articleText, sourceName);
				} catch (err) {
					skipped.push(`${category}/web: gen failed — ${err instanceof Error ? err.message : 'unknown'}`);
					continue;
				}

				const dupCheck2 = await checkDuplicate(db, article.title, result.url);
				if (dupCheck2.isDuplicate) {
					skipped.push(`${category}/web: dup after gen — ${article.title.slice(0, 60)}`);
					continue;
				}

				const imageUrl = (googleKey && storage)
					? await generateAndStoreImage(googleKey, storage, article.image_prompt)
					: null;

				const storyId = await insertStory(db, article, imageUrl, result.url, 'discover', result.url);
				created.push({ id: storyId, title: article.title, category, source: 'web' });
				generated++;
			}
		}
	}

	// Sort: X-sourced stories first (they're breaking/trending)
	created.sort((a, b) => {
		if (a.source === 'x' && b.source !== 'x') return -1;
		if (a.source !== 'x' && b.source === 'x') return 1;
		return 0;
	});

	return { created, skipped };
}
