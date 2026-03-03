<script lang="ts">
	import { CATEGORIES, CATEGORY_CONFIG } from '$lib/constants';

	let { selected = $bindable('all') }: { selected: string } = $props();

	function select(cat: string) {
		selected = cat;
	}
</script>

<div class="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-3">
	<button
		onclick={() => select('all')}
		class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all {selected === 'all'
			? 'bg-zinc-100 text-zinc-900'
			: 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
	>
		All
	</button>
	{#each CATEGORIES as cat}
		{@const config = CATEGORY_CONFIG[cat]}
		<button
			onclick={() => select(cat)}
			class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all {selected === cat
				? `${config.bg} ${config.color} ring-1 ring-current/20`
				: 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
		>
			{config.label}
		</button>
	{/each}
</div>
