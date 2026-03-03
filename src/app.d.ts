declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				STORAGE: R2Bucket;
				OPENAI_API_KEY: string;
				ATLAS_DAILY_API_KEY: string;
			};
		}
	}
}

export {};
