import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateTTS } from '$lib/server/openai';
import { getSecret } from '$lib/server/env';

export const POST: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	const storage = platform?.env?.STORAGE;
	const openaiKey = getSecret(platform, 'OPENAI_API_KEY');

	if (!db) return json({ error: 'Database not available' }, { status: 503 });
	if (!openaiKey) return json({ error: 'OpenAI API key not configured' }, { status: 503 });

	const story = await db.prepare('SELECT * FROM stories WHERE id = ?').bind(params.id).first();
	if (!story) return json({ error: 'Story not found' }, { status: 404 });

	// If audio already exists, return it
	if (story.audio_url) {
		return json({ audio_url: story.audio_url });
	}

	try {
		const bodyText = story.body as string;
		const title = story.title as string;
		const ttsInput = `${title}. ${bodyText}`;

		const audioBuffer = await generateTTS(openaiKey, ttsInput);

		let audioUrl: string;
		if (storage) {
			const audioKey = `audio/${params.id}.mp3`;
			await storage.put(audioKey, audioBuffer, {
				httpMetadata: { contentType: 'audio/mpeg' }
			});
			audioUrl = `https://pub-2049fec7caa24f8ebe3bc824e0ab04e5.r2.dev/${audioKey}`;
		} else {
			// Fallback: return as data URL (not ideal for prod)
			const b64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
			audioUrl = `data:audio/mpeg;base64,${b64}`;
		}

		// Update the story with audio URL
		await db
			.prepare('UPDATE stories SET audio_url = ? WHERE id = ?')
			.bind(audioUrl, params.id)
			.run();

		return json({ audio_url: audioUrl });
	} catch (err) {
		console.error('TTS generation error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to generate audio' },
			{ status: 500 }
		);
	}
};
