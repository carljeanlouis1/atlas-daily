import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chatCompletion, generateImage } from '$lib/server/openai';
import { checkDuplicate, computeHash } from '$lib/server/dedup';
import { detectInputType, extractYouTubeId, fetchUrlContent, fetchYouTubeInfo } from '$lib/server/extract';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const storage = platform?.env?.STORAGE;
	const anthropicKey = platform?.env?.ANTHROPIC_API_KEY;
	const googleKey = platform?.env?.GOOGLE_API_KEY;
	const apiKey = platform?.env?.ATLAS_DAILY_API_KEY;

	if (!db) return json({ error: 'Database not available' }, { status: 503 });
	if (!anthropicKey) return json({ error: 'Anthropic API key not configured' }, { status: 503 });

	// Auth check
	const reqKey = request.headers.get('X-API-Key');
	if (!reqKey || reqKey !== apiKey) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { type, content, category: forcedCategory } = body as {
		type: 'text' | 'url' | 'image';
		content: string;
		category?: string;
	};

	if (!type || !content) {
		return json({ error: 'type and content are required' }, { status: 400 });
	}

	let sourceContent = '';
	let sourceName = 'Atlas Daily';
	let sourceUrl: string | null = null;
	let inputType = type as string;

	try {
		if (type === 'url') {
			const detectedType = detectInputType(content);
			inputType = detectedType;

			if (detectedType === 'youtube') {
				const videoId = extractYouTubeId(content);
				if (!videoId) return json({ error: 'Could not parse YouTube URL' }, { status: 400 });
				const ytInfo = await fetchYouTubeInfo(videoId);
				sourceContent = `Video Title: ${ytInfo.title}\n\nContent: ${ytInfo.text}`;
				sourceName = 'YouTube';
				sourceUrl = content;
			} else if (detectedType === 'tiktok') {
				sourceContent = `TikTok video URL: ${content}. Analyze this TikTok content and create a news article about the topic it covers.`;
				sourceName = 'TikTok';
				sourceUrl = content;
				inputType = 'tiktok';
			} else {
				const urlContent = await fetchUrlContent(content);
				sourceContent = `Article Title: ${urlContent.title}\n\nContent: ${urlContent.text}`;
				sourceName = urlContent.siteName;
				sourceUrl = content;
			}
		} else if (type === 'image') {
			sourceContent = '[Image/screenshot provided by user — see image data in analysis]';
			inputType = 'image';
		} else {
			sourceContent = content;
			inputType = 'text';
		}

		// Build the prompt for article generation
		const systemPrompt = `You are an elite editorial writer for Atlas Daily, a premium intelligence briefing service. Your writing style is:
- Authoritative and analytical, like The Economist or Foreign Affairs
- Opinionated with clear perspective, not neutral wire-service style
- Rich with context and implications — explain WHY things matter
- Concise but thorough — every sentence should earn its place

Output valid JSON only, no markdown code fences. Use this exact schema:
{
  "title": "Compelling headline (max 100 chars)",
  "summary": "2-3 sentence hook that captures the key insight (150-250 chars)",
  "body": "<p>Paragraph 1...</p><p>Paragraph 2...</p><p>Paragraph 3...</p><p>Paragraph 4...</p>",
  "category": "one of: ai, geopolitics, politics, culture, markets, tech, business",
  "source": "Original source name",
  "read_time": estimated_minutes_as_number,
  "image_prompt": "A prompt for generating an editorial news thumbnail image: moody, cinematic, abstract representation of the topic. Dark tones, dramatic lighting, photojournalistic feel. No text or words in the image."
}

The body must be 4-6 paragraphs wrapped in <p> tags, totaling 800-1500 words. Write like a senior analyst at a top think tank — informed, incisive, and occasionally provocative.`;

		// Build Anthropic content blocks
		const userContent: Array<{ type: 'text' | 'image'; text?: string; source?: { type: 'base64'; media_type: string; data: string } }> = [];

		if (type === 'image') {
			userContent.push({
				type: 'image',
				source: { type: 'base64', media_type: 'image/jpeg', data: content }
			});
			userContent.push({
				type: 'text',
				text: 'Analyze this screenshot/image and write a full analytical article about the news or topic shown. Detect the appropriate category.'
			});
		} else {
			let prompt = `Write a full analytical article based on this content:\n\n${sourceContent}`;
			if (forcedCategory) {
				prompt += `\n\nUse category: ${forcedCategory}`;
			}
			userContent.push({ type: 'text', text: prompt });
		}

		const result = await chatCompletion(anthropicKey, systemPrompt, userContent);

		// Parse the JSON response — handle potential markdown fences
		const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		const article = JSON.parse(cleaned) as {
			title: string;
			summary: string;
			body: string;
			category: string;
			source: string;
			read_time: number;
			image_prompt: string;
		};

		// Override category if forced
		if (forcedCategory) {
			article.category = forcedCategory;
		}
		// Override source if we detected one
		if (sourceName !== 'Atlas Daily') {
			article.source = sourceName;
		}

		// Check for duplicates
		const dupCheck = await checkDuplicate(db, article.title, sourceUrl);
		if (dupCheck.isDuplicate) {
			return json({ error: dupCheck.reason, duplicate: true }, { status: 409 });
		}

		// Generate image via Gemini
		let imageUrl: string | null = null;
		if (googleKey) {
			try {
				const imageB64 = await generateImage(googleKey, article.image_prompt);
				if (storage) {
					const imageKey = `images/${crypto.randomUUID()}.png`;
					const imageBytes = Uint8Array.from(atob(imageB64), (c) => c.charCodeAt(0));
					await storage.put(imageKey, imageBytes, {
						httpMetadata: { contentType: 'image/png' }
					});
					imageUrl = `/api/r2/${imageKey}`;
				}
			} catch (err) {
				console.error('Image generation failed:', err);
			}
		}

		// Insert story
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
				content.slice(0, 2000)
			)
			.run();

		const story = await db.prepare('SELECT * FROM stories WHERE id = ?').bind(storyId).first();

		return json({ story, message: 'Story generated successfully' }, { status: 201 });
	} catch (err) {
		console.error('Generation error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to generate story' },
			{ status: 500 }
		);
	}
};
