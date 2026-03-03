const OPENAI_API = 'https://api.openai.com/v1';
const ANTHROPIC_API = 'https://api.anthropic.com/v1';

interface AnthropicContentBlock {
	type: 'text' | 'image';
	text?: string;
	source?: { type: 'base64'; media_type: string; data: string };
}

export async function chatCompletion(
	apiKey: string,
	systemPrompt: string,
	userContent: AnthropicContentBlock[],
	options: { model?: string; temperature?: number; max_tokens?: number } = {}
): Promise<string> {
	const res = await fetch(`${ANTHROPIC_API}/messages`, {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: options.model || 'claude-sonnet-4-5-20250929',
			max_tokens: options.max_tokens ?? 4096,
			temperature: options.temperature ?? 0.7,
			system: systemPrompt,
			messages: [
				{ role: 'user', content: userContent }
			]
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Anthropic API error (${res.status}): ${err}`);
	}

	const data = await res.json() as { content: Array<{ type: string; text: string }> };
	const textBlock = data.content.find((b) => b.type === 'text');
	if (!textBlock) throw new Error('No text response from Anthropic');
	return textBlock.text;
}

export async function generateImage(
	apiKey: string,
	prompt: string
): Promise<string> {
	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{ text: prompt }
						]
					}
				],
				generationConfig: {
					responseModalities: ['TEXT', 'IMAGE']
				}
			})
		}
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Gemini image API error (${res.status}): ${err}`);
	}

	const data = await res.json() as {
		candidates: Array<{
			content: {
				parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
			};
		}>;
	};

	const parts = data.candidates?.[0]?.content?.parts;
	if (!parts) throw new Error('No response from Gemini image API');

	const imagePart = parts.find((p) => p.inlineData);
	if (!imagePart?.inlineData) throw new Error('No image data in Gemini response');

	return imagePart.inlineData.data;
}

export async function generateTTS(
	apiKey: string,
	text: string,
	voice: string = 'nova'
): Promise<ArrayBuffer> {
	// Strip HTML tags for TTS
	const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

	const res = await fetch(`${OPENAI_API}/audio/speech`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'tts-1',
			input: plainText.slice(0, 4096),
			voice,
			response_format: 'mp3'
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`TTS API error (${res.status}): ${err}`);
	}

	return res.arrayBuffer();
}
