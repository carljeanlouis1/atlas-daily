export function detectInputType(content: string): 'youtube' | 'tiktok' | 'url' | 'text' {
	const trimmed = content.trim();

	if (/(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/.test(trimmed)) {
		return 'youtube';
	}
	if (/tiktok\.com/.test(trimmed)) {
		return 'tiktok';
	}
	if (/^https?:\/\//i.test(trimmed)) {
		return 'url';
	}
	return 'text';
}

export function extractYouTubeId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
	];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	return null;
}

export async function fetchUrlContent(url: string): Promise<{ title: string; text: string; siteName: string }> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; AtlasDaily/1.0)',
			Accept: 'text/html,application/xhtml+xml'
		}
	});

	if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

	const html = await res.text();

	// Extract title
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
	const title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled';

	// Extract site name
	const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
	const siteName = siteMatch?.[1] || new URL(url).hostname.replace('www.', '');

	// Extract main text content - strip tags, scripts, styles
	const cleaned = html
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<nav[\s\S]*?<\/nav>/gi, '')
		.replace(/<header[\s\S]*?<\/header>/gi, '')
		.replace(/<footer[\s\S]*?<\/footer>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&[a-z]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	// Take a reasonable chunk of text
	const text = cleaned.slice(0, 8000);

	return { title: title.trim(), text, siteName };
}

export async function fetchYouTubeInfo(videoId: string): Promise<{ title: string; text: string }> {
	// Try to get video info via oembed (no API key needed)
	const oembedRes = await fetch(
		`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
	);

	let title = 'YouTube Video';
	if (oembedRes.ok) {
		const oembed = await oembedRes.json() as { title: string; author_name: string };
		title = oembed.title;
	}

	// Try to fetch transcript via a public transcript endpoint
	let text = '';
	try {
		const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtlasDaily/1.0)' }
		});
		const pageHtml = await pageRes.text();
		const descMatch = pageHtml.match(/"shortDescription":"([^"]+)"/);
		if (descMatch) {
			text = descMatch[1]
				.replace(/\\n/g, '\n')
				.replace(/\\"/g, '"')
				.slice(0, 4000);
		}
	} catch {
		// fallback: just use the title
	}

	return { title, text: text || `YouTube video: ${title}` };
}
