<script lang="ts">
	import { browser } from '$app/environment';

	let { storyId }: { storyId: string } = $props();

	let bookmarked = $state(false);

	$effect(() => {
		if (browser) {
			const bookmarks = getBookmarks();
			bookmarked = bookmarks.includes(storyId);
		}
	});

	function getBookmarks(): string[] {
		try {
			return JSON.parse(localStorage.getItem('atlas-bookmarks') || '[]');
		} catch {
			return [];
		}
	}

	function toggle() {
		const bookmarks = getBookmarks();
		if (bookmarked) {
			const filtered = bookmarks.filter((id: string) => id !== storyId);
			localStorage.setItem('atlas-bookmarks', JSON.stringify(filtered));
			bookmarked = false;
		} else {
			bookmarks.push(storyId);
			localStorage.setItem('atlas-bookmarks', JSON.stringify(bookmarks));
			bookmarked = true;
		}
	}
</script>

<button
	onclick={toggle}
	class="rounded-lg p-1 transition-colors hover:bg-zinc-800 {bookmarked ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}"
	aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
>
	<svg class="h-4 w-4" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
	</svg>
</button>
