export interface Story {
	id: string;
	title: string;
	summary: string;
	body: string;
	category: string;
	image_url: string | null;
	audio_url: string | null;
	source: string;
	source_url: string | null;
	published_at: string;
	read_time: number;
	content_hash: string | null;
	input_type: string | null;
	original_input: string | null;
	created_at: string;
}

export interface SubmissionPayload {
	type: 'text' | 'url' | 'image';
	content: string;
	category?: string;
}

export interface GenerateResponse {
	story: Story;
	duplicate?: boolean;
	message?: string;
}
