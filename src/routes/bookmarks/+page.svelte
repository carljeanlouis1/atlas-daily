<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Story } from '$lib/types';
	import StoryCard from '$lib/components/StoryCard.svelte';

	let stories = $state<Story[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const raw = localStorage.getItem('atlas-bookmarks');
			const ids: string[] = raw ? JSON.parse(raw) : [];
			if (ids.length === 0) {
				loading = false;
				return;
			}

			const fetched: Story[] = [];
			for (const id of ids) {
				try {
					const res = await fetch(`/api/stories/${id}`);
					if (res.ok) {
						fetched.push(await res.json());
					}
				} catch {
					// skip failed fetches
				}
			}
			stories = fetched;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Bookmarks — Atlas Daily</title>
</svelte:head>

<div class="mb-6">
	<h1 class="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Saved Stories</h1>
	<p class="text-sm text-zinc-500">Your bookmarked articles</p>
</div>

{#if loading}
	<div class="mt-6 grid gap-5">
		{#each Array(2) as _}
			<div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
				<div class="skeleton mb-3 h-44 w-full"></div>
				<div class="skeleton mb-2 h-5 w-3/4"></div>
				<div class="skeleton h-3 w-1/3"></div>
			</div>
		{/each}
	</div>
{:else if stories.length === 0}
	<div class="mt-16 text-center">
		<div class="mb-3 text-4xl">📑</div>
		<p class="text-lg text-zinc-500">No saved stories yet</p>
		<p class="mt-1 text-sm text-zinc-600">Bookmark stories from the feed to read later</p>
		<a
			href="/"
			class="mt-4 inline-block rounded-xl bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
		>
			Browse Feed
		</a>
	</div>
{:else}
	<div class="grid gap-5">
		{#each stories as story, i (story.id)}
			<StoryCard {story} index={i} />
		{/each}
	</div>
{/if}
