import { env as privateEnv } from '$env/dynamic/private';

/**
 * Get a secret/env var from the best available source.
 *
 * Cloudflare Pages with wrangler.toml: secrets set via dashboard/CLI
 * may not appear in platform.env when wrangler.toml is the source of truth.
 * SvelteKit's $env/dynamic/private (populated from server.init({ env }))
 * and platform.env are both checked.
 */
export function getSecret(
	platform: App.Platform | undefined,
	key: string
): string | undefined {
	// Try platform.env first (works for bindings + some secrets)
	const fromPlatform = (platform?.env as Record<string, unknown>)?.[key];
	if (typeof fromPlatform === 'string' && fromPlatform) return fromPlatform;

	// Fall back to SvelteKit's $env/dynamic/private
	const fromSvelteEnv = privateEnv[key];
	if (fromSvelteEnv) return fromSvelteEnv;

	return undefined;
}
