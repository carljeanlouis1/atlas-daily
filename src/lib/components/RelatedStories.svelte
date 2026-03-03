<script lang="ts">
	import type { Story } from '$lib/types';
	import { CATEGORY_CONFIG, type Category } from '$lib/constants';
	import { timeAgo } from '$lib/utils';

	let { stories }: { stories: Story[] } = $props();
</script>

{#if stories.length > 0}
	<section class="mt-10">
		<h3 class="mb-4 text-lg font-bold text-zinc-100">Related Stories</h3>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each stories as story}
				{@const config = CATEGORY_CONFIG[story.category as Category]}
				<a
					href="/story/{story.id}"
					class="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
				>
					{#if config}
						<span class="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold {config.bg} {config.color}">
							{config.label}
						</span>
					{/if}
					<h4 class="mb-1 text-sm font-semibold leading-snug text-zinc-200 group-hover:text-white">
						{story.title}
					</h4>
					<div class="text-xs text-zinc-500">
						{story.source} · {timeAgo(story.published_at)}
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}
