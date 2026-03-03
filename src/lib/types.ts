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
	created_at: string;
}
