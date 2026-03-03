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

	let audioUrl = $state<string | null>(data.story.audio_url);
	let generatingAudio = $state(false);
	let audioError = $state('');

	async function generateAudio() {
		generatingAudio = true;
		audioError = '';
		try {
			const res = await fetch(`/api/stories/${data.story.id}/audio`, { method: 'POST' });
			const result = await res.json();
			if (!res.ok) {
				audioError = result.error || 'Failed to generate audio';
				return;
			}
			audioUrl = result.audio_url;
		} catch {
			audioError = 'Network error generating audio';
		} finally {
			generatingAudio = false;
		}
	}
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

	<!-- Audio player or Listen button -->
	<div class="mb-8">
		{#if audioUrl}
			<AudioPlayer src={audioUrl} />
		{:else}
			<button
				onclick={generateAudio}
				disabled={generatingAudio}
				class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if generatingAudio}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					Generating audio...
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
					</svg>
					Listen to this article
				{/if}
			</button>
			{#if audioError}
				<p class="mt-2 text-center text-xs text-rose-400">{audioError}</p>
			{/if}
			{#if generatingAudio}
				<p class="mt-2 text-center text-xs text-zinc-600">Generating audio with AI — this may take 15-30 seconds</p>
			{/if}
		{/if}
	</div>

	<!-- Body -->
	<div class="prose-atlas text-base leading-relaxed text-zinc-300 [&>p]:mb-4">
		{@html data.story.body}
	</div>

	<!-- Related -->
	<RelatedStories stories={data.related} />
</article>
