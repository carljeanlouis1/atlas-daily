<script lang="ts">
	import type { Story } from '$lib/types';
	import { CATEGORY_CONFIG, type Category } from '$lib/constants';
	import { timeAgo, readTimeLabel, freshness } from '$lib/utils';
	import BookmarkButton from './BookmarkButton.svelte';

	let { story, index = 0 }: { story: Story; index?: number } = $props();

	const config = $derived(CATEGORY_CONFIG[story.category as Category]);
	const fresh = $derived(freshness(story.published_at));
	const sourceType = $derived(
		story.input_type === 'x-trend' ? 'x'
		: story.input_type === 'discover' ? 'web'
		: story.input_type ? 'submitted'
		: null
	);
</script>

<article
	class="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
	style="animation-delay: {index * 60}ms"
>
	{#if story.image_url}
		<a href="/story/{story.id}" class="block">
			<div class="relative aspect-[16/9] overflow-hidden">
				<img
					src={story.image_url}
					alt={story.title}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					loading="lazy"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent"></div>
				<div class="absolute top-3 left-3 flex items-center gap-2">
					{#if config}
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md {config.bg} {config.color}"
						>
							{config.label}
						</span>
					{/if}
					{#if fresh === 'breaking'}
						<span class="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">BREAKING</span>
					{:else if fresh === 'today'}
						<span class="rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">NEW</span>
					{/if}
					{#if sourceType === 'x'}
						<span class="rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-bold text-sky-400 backdrop-blur-md">🔥 Trending on X</span>
					{/if}
				</div>
			</div>
		</a>
	{/if}

	<div class="p-4 {story.image_url ? 'pt-3' : ''}">
		{#if !story.image_url}
			<div class="mb-2 flex items-center gap-2">
				{#if config}
					<span
						class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold {config.bg} {config.color}"
					>
						{config.label}
					</span>
				{/if}
				{#if fresh === 'breaking'}
					<span class="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">BREAKING</span>
				{:else if fresh === 'today'}
					<span class="rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>
				{/if}
				{#if sourceType === 'x'}
					<span class="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400">🔥 Trending on X</span>
				{/if}
			</div>
		{/if}

		<a href="/story/{story.id}" class="block">
			<h2 class="mb-2 text-lg font-bold leading-snug text-zinc-100 group-hover:text-white">
				{story.title}
			</h2>
			<p class="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
				{story.summary}
			</p>
		</a>

		<div class="flex items-center justify-between text-xs text-zinc-500">
			<div class="flex items-center gap-2">
				<span class="font-medium text-zinc-400">{story.source}</span>
				{#if sourceType === 'x'}
					<span class="text-sky-500">via X</span>
				{:else if sourceType === 'web'}
					<span>via Web</span>
				{:else if sourceType === 'submitted'}
					<span>Submitted</span>
				{/if}
				<span>·</span>
				{#if fresh === 'breaking'}
					<span class="text-red-400">{timeAgo(story.published_at)}</span>
				{:else}
					<span>{timeAgo(story.published_at)}</span>
				{/if}
				<span>·</span>
				<span>{readTimeLabel(story.read_time)}</span>
			</div>
			<BookmarkButton storyId={story.id} />
		</div>
	</div>
</article>
