<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<Nav />

<main class="mx-auto min-h-screen max-w-3xl px-4 pt-18 pb-24 sm:pb-8">
	{@render children()}
</main>
