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

<div class="mb-6">
	<h1 class="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Your Feed</h1>
	<p class="text-sm text-zinc-500">Stay informed with curated analysis</p>
</div>

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
		<p class="text-lg text-zinc-500">No stories found</p>
		<p class="mt-1 text-sm text-zinc-600">Check back soon for new content</p>
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
