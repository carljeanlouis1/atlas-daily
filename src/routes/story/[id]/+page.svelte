<script lang="ts">
	import { CATEGORY_CONFIG, type Category } from '$lib/constants';
	import { formatDate, readTimeLabel } from '$lib/utils';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import RelatedStories from '$lib/components/RelatedStories.svelte';
	import { page } from '$app/state';

	let { data } = $props();
	const config = $derived(CATEGORY_CONFIG[data.story.category as Category]);
</script>

<svelte:head>
	<title>{data.story.title} — Atlas Daily</title>
	<meta name="description" content={data.story.summary} />
</svelte:head>

<article class="animate-fade-in">
	<!-- Back button -->
	<div class="mb-6">
		<a
			href="/"
			class="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
			</svg>
			Back to feed
		</a>
	</div>

	<!-- Hero image -->
	{#if data.story.image_url}
		<div class="relative -mx-4 mb-6 aspect-[2/1] overflow-hidden sm:mx-0 sm:rounded-2xl">
			<img
				src={data.story.image_url}
				alt={data.story.title}
				class="h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>
		</div>
	{/if}

	<!-- Meta -->
	<div class="mb-4 flex flex-wrap items-center gap-3">
		{#if config}
			<span class="rounded-full px-3 py-1 text-xs font-semibold {config.bg} {config.color}">
				{config.label}
			</span>
		{/if}
		<span class="text-sm text-zinc-500">{formatDate(data.story.published_at)}</span>
		<span class="text-sm text-zinc-600">·</span>
		<span class="text-sm text-zinc-500">{readTimeLabel(data.story.read_time)}</span>
	</div>

	<!-- Title -->
	<h1 class="mb-3 text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
		{data.story.title}
	</h1>

	<!-- Summary -->
	<p class="mb-6 text-base leading-relaxed text-zinc-400">
		{data.story.summary}
	</p>

	<!-- Source & actions -->
	<div class="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
		<div class="flex items-center gap-2 text-sm text-zinc-500">
			<span class="font-medium text-zinc-400">{data.story.source}</span>
			{#if data.story.source_url}
				<a
					href={data.story.source_url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-zinc-600 transition-colors hover:text-zinc-400"
				>
					↗
				</a>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<BookmarkButton storyId={data.story.id} />
			<ShareButton title={data.story.title} url={page.url.href} />
		</div>
	</div>

	<!-- Audio player -->
	{#if data.story.audio_url}
		<div class="mb-8">
			<AudioPlayer src={data.story.audio_url} />
		</div>
	{/if}

	<!-- Body -->
	<div class="prose-atlas text-base leading-relaxed text-zinc-300 [&>p]:mb-4">
		{@html data.story.body}
	</div>

	<!-- Related -->
	<RelatedStories stories={data.related} />
</article>
