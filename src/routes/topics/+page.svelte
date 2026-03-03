<script lang="ts">
	import { CATEGORY_CONFIG, type Category } from '$lib/constants';
	import { timeAgo } from '$lib/utils';

	let { data } = $props();
</script>

<svelte:head>
	<title>Topics — Atlas Daily</title>
</svelte:head>

<div class="mb-6">
	<h1 class="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Topics</h1>
	<p class="text-sm text-zinc-500">Explore stories by category</p>
</div>

{#if data.topics.length === 0}
	<div class="mt-16 text-center">
		<p class="text-lg text-zinc-500">No topics yet</p>
		<p class="mt-1 text-sm text-zinc-600">Stories will appear here once published</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2">
		{#each data.topics as topic, i}
			{@const config = CATEGORY_CONFIG[topic.category as Category]}
			<a
				href="/?category={topic.category}"
				class="animate-fade-in-up group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
				style="animation-delay: {i * 80}ms"
			>
				{#if config}
					<div class="mb-3 flex items-center justify-between">
						<span class="rounded-full px-3 py-1 text-sm font-semibold {config.bg} {config.color}">
							{config.label}
						</span>
						<span class="text-sm text-zinc-600">{topic.count} {topic.count === 1 ? 'story' : 'stories'}</span>
					</div>
				{/if}

				{#if topic.latest_title}
					<p class="mb-2 text-sm font-medium leading-snug text-zinc-300 group-hover:text-zinc-100">
						{topic.latest_title}
					</p>
				{/if}

				{#if topic.latest_published}
					<p class="text-xs text-zinc-600">
						Latest: {timeAgo(topic.latest_published)}
					</p>
				{/if}
			</a>
		{/each}
	</div>
{/if}
