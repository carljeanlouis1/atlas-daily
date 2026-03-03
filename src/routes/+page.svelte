<script lang="ts">
	import type { Story } from '$lib/types';
	import { PAGE_SIZE } from '$lib/constants';
	import StoryCard from '$lib/components/StoryCard.svelte';
	import CategoryFilter from '$lib/components/CategoryFilter.svelte';

	let { data } = $props();

	let stories = $state<Story[]>(data.stories);
	let category = $state('all');
	let loading = $state(false);
	let offset = $state(data.stories.length);
	let hasMore = $state(data.stories.length >= PAGE_SIZE);

	let discovering = $state(false);
	let discoverError = $state('');
	let discoverCount = $state(0);

	$effect(() => {
		stories = data.stories;
		offset = data.stories.length;
		hasMore = data.stories.length >= PAGE_SIZE;
	});

	async function filterByCategory(cat: string) {
		category = cat;
		loading = true;
		try {
			const params = new URLSearchParams();
			if (cat !== 'all') params.set('category', cat);
			params.set('limit', String(PAGE_SIZE));
			const res = await fetch(`/api/stories?${params}`);
			const json = await res.json();
			stories = json.stories;
			offset = json.stories.length;
			hasMore = json.stories.length >= PAGE_SIZE;
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (category !== 'all') params.set('category', category);
			params.set('limit', String(PAGE_SIZE));
			params.set('offset', String(offset));
			const res = await fetch(`/api/stories?${params}`);
			const json = await res.json();
			stories = [...stories, ...json.stories];
			offset += json.stories.length;
			hasMore = json.stories.length >= PAGE_SIZE;
		} finally {
			loading = false;
		}
	}

	async function discover() {
		discovering = true;
		discoverError = '';
		discoverCount = 0;

		try {
			const body: Record<string, unknown> = { count: 1 };
			if (category !== 'all') body.categories = [category];

			const res = await fetch('/api/stories/discover', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await res.json();
			if (!res.ok) {
				discoverError = result.error || 'Discovery failed';
				return;
			}

			discoverCount = result.created?.length || 0;

			// Reload feed
			if (discoverCount > 0) {
				await filterByCategory(category);
			}
		} catch (err) {
			discoverError = err instanceof Error ? err.message : 'Network error';
		} finally {
			discovering = false;
		}
	}

	// Watch category changes
	let prevCategory = $state('all');
	$effect(() => {
		if (category !== prevCategory) {
			prevCategory = category;
			filterByCategory(category);
		}
	});
</script>

<svelte:head>
	<title>Atlas Daily — Your Intelligence Feed</title>
</svelte:head>

<div class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Your Feed</h1>
		<p class="text-sm text-zinc-500">Stay informed with curated analysis</p>
	</div>
	<button
		onclick={discover}
		disabled={discovering}
		class="mt-1 flex shrink-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{#if discovering}
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Searching...
		{:else}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg>
			Discover
		{/if}
	</button>
</div>

{#if discovering}
	<div class="animate-fade-in mb-6 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-center">
		<p class="text-sm font-medium text-violet-300">Agents are searching for stories...</p>
		<p class="mt-1 text-xs text-violet-400/60">Searching the web, writing articles, generating artwork</p>
	</div>
{/if}

{#if discoverError}
	<div class="animate-fade-in mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
		{discoverError}
	</div>
{/if}

{#if discoverCount > 0 && !discovering}
	<div class="animate-fade-in mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
		{discoverCount} new {discoverCount === 1 ? 'story' : 'stories'} added to your feed
	</div>
{/if}

<CategoryFilter bind:selected={category} />

{#if loading && stories.length === 0}
	<div class="mt-6 grid gap-5">
		{#each Array(3) as _}
			<div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
				<div class="skeleton mb-3 h-44 w-full"></div>
				<div class="skeleton mb-2 h-5 w-3/4"></div>
				<div class="skeleton mb-2 h-4 w-full"></div>
				<div class="skeleton h-3 w-1/3"></div>
			</div>
		{/each}
	</div>
{:else if stories.length === 0}
	<div class="mt-16 text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-3xl">🌐</div>
		<p class="text-lg font-medium text-zinc-400">No stories yet</p>
		<p class="mt-1 text-sm text-zinc-600">Discover stories or submit your own to get started</p>
		<div class="mt-4 flex items-center justify-center gap-3">
			<button
				onclick={discover}
				disabled={discovering}
				class="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-white disabled:opacity-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				Discover Stories
			</button>
			<a
				href="/submit"
				class="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Submit
			</a>
		</div>
	</div>
{:else}
	<div class="mt-4 grid gap-5">
		{#each stories as story, i (story.id)}
			<StoryCard {story} index={i} />
		{/each}
	</div>

	{#if hasMore}
		<div class="mt-8 flex justify-center">
			<button
				onclick={loadMore}
				disabled={loading}
				class="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
			>
				{loading ? 'Loading...' : 'Load More'}
			</button>
		</div>
	{/if}
{/if}
