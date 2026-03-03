const OPENAI_API = 'https://api.openai.com/v1';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export async function chatCompletion(
	apiKey: string,
	messages: ChatMessage[],
	options: { model?: string; temperature?: number; max_tokens?: number } = {}
): Promise<string> {
	const res = await fetch(`${OPENAI_API}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: options.model || 'gpt-4o',
			messages,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.max_tokens ?? 4096
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`OpenAI API error (${res.status}): ${err}`);
	}

	const data = await res.json() as { choices: Array<{ message: { content: string } }> };
	return data.choices[0].message.content;
}

export async function generateImage(
	apiKey: string,
	prompt: string
): Promise<string> {
	const res = await fetch(`${OPENAI_API}/images/generations`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'dall-e-3',
			prompt,
			n: 1,
			size: '1792x1024',
			quality: 'standard',
			response_format: 'b64_json'
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`DALL-E API error (${res.status}): ${err}`);
	}

	const data = await res.json() as { data: Array<{ b64_json: string }> };
	return data.data[0].b64_json;
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
