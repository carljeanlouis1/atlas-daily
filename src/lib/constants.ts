export const APP_NAME = 'Atlas Daily';
export const APP_DESCRIPTION = 'Your personal intelligence feed';

export const CATEGORIES = [
	'ai',
	'geopolitics',
	'politics',
	'culture',
	'markets',
	'tech',
	'business'
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string }> = {
	ai: { label: 'AI', color: 'text-violet-400', bg: 'bg-violet-500/20' },
	geopolitics: { label: 'Geopolitics', color: 'text-amber-400', bg: 'bg-amber-500/20' },
	politics: { label: 'Politics', color: 'text-rose-400', bg: 'bg-rose-500/20' },
	culture: { label: 'Culture', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
	markets: { label: 'Markets', color: 'text-blue-400', bg: 'bg-blue-500/20' },
	tech: { label: 'Tech', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
	business: { label: 'Business', color: 'text-orange-400', bg: 'bg-orange-500/20' }
};

export const PAGE_SIZE = 12;
