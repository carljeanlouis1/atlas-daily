import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as privateEnv } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ platform }) => {
	const platformKeys = platform?.env ? Object.keys(platform.env) : [];
	const svelteEnvKeys = Object.keys(privateEnv);
	
	return json({
		platformEnvKeys: platformKeys,
		svelteEnvKeys: svelteEnvKeys,
		hasBraveOnPlatform: !!(platform?.env as any)?.BRAVE_API_KEY,
		hasBraveOnSvelte: !!privateEnv.BRAVE_API_KEY,
	});
};
