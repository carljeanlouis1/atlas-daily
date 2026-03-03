<script lang="ts">
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/constants';

	const navItems = [
		{ href: '/', label: 'Feed', icon: 'feed' },
		{ href: '/topics', label: 'Topics', icon: 'topics' },
		{ href: '/bookmarks', label: 'Saved', icon: 'bookmarks' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<!-- Top Nav -->
<header class="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
	<div class="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
		<a href="/" class="flex items-center gap-2 font-bold tracking-tight text-zinc-100">
			<span class="text-lg">🌐</span>
			<span>{APP_NAME}</span>
		</a>
		<nav class="hidden gap-1 sm:flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.href) ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>
</header>

<!-- Bottom Mobile Nav -->
<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-xl sm:hidden">
	<div class="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors {isActive(item.href) ? 'text-zinc-100' : 'text-zinc-500'}"
			>
				{#if item.icon === 'feed'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
					</svg>
				{:else if item.icon === 'topics'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
					</svg>
				{/if}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
