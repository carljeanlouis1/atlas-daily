<script lang="ts">
	import { browser } from '$app/environment';

	let { title, url }: { title: string; url: string } = $props();
	let copied = $state(false);

	async function share() {
		if (browser && navigator.share) {
			try {
				await navigator.share({ title, url });
			} catch {
				// user cancelled
			}
		} else if (browser) {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<button
	onclick={share}
	class="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
>
	{#if copied}
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
		</svg>
		Copied
	{:else}
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
		</svg>
		Share
	{/if}
</button>
