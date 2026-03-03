declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				STORAGE: R2Bucket;
				ANTHROPIC_API_KEY: string;
				GOOGLE_API_KEY: string;
				OPENAI_API_KEY: string;
				BRAVE_API_KEY: string;
				XAI_API_KEY: string;
				CRON_SECRET: string;
				ATLAS_DAILY_API_KEY: string;
			};
		}
	}
}

export {};
