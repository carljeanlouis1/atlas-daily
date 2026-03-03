<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { CATEGORIES, CATEGORY_CONFIG, type Category } from '$lib/constants';

	let inputMode = $state<'text' | 'url' | 'image'>('text');
	let textContent = $state('');
	let urlContent = $state('');
	let imageData = $state<string | null>(null);
	let imageName = $state('');
	let category = $state('');
	let apiKey = $state('');
	let submitting = $state(false);
	let error = $state('');
	let success = $state<{ id: string; title: string } | null>(null);
	let dragOver = $state(false);

	// Load saved API key
	$effect(() => {
		if (browser) {
			apiKey = localStorage.getItem('atlas-api-key') || '';
		}
	});

	function saveApiKey() {
		if (browser) localStorage.setItem('atlas-api-key', apiKey);
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) processFile(input.files[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (e.dataTransfer?.files?.[0]) processFile(e.dataTransfer.files[0]);
	}

	function processFile(file: File) {
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file';
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			error = 'Image must be under 10MB';
			return;
		}
		imageName = file.name;
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			imageData = result.split(',')[1]; // Remove data:... prefix
		};
		reader.readAsDataURL(file);
	}

	function autoDetectUrl() {
		const val = urlContent.trim();
		if (/youtube\.com|youtu\.be/.test(val)) return 'YouTube video detected';
		if (/tiktok\.com/.test(val)) return 'TikTok video detected';
		if (/^https?:\/\//.test(val)) return 'Web article detected';
		return '';
	}

	async function handleSubmit() {
		error = '';
		success = null;

		if (!apiKey) {
			error = 'API key is required';
			return;
		}

		let type: 'text' | 'url' | 'image' = inputMode;
		let content = '';

		if (inputMode === 'text') {
			if (!textContent.trim()) { error = 'Please enter some text'; return; }
			content = textContent.trim();
		} else if (inputMode === 'url') {
			if (!urlContent.trim()) { error = 'Please enter a URL'; return; }
			content = urlContent.trim();
		} else {
			if (!imageData) { error = 'Please select an image'; return; }
			content = imageData;
		}

		saveApiKey();
		submitting = true;

		try {
			const res = await fetch('/api/stories/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': apiKey
				},
				body: JSON.stringify({
					type,
					content,
					category: category || undefined
				})
			});

			const data = await res.json();

			if (!res.ok) {
				if (data.duplicate) {
					error = `Duplicate story: ${data.error}`;
				} else {
					error = data.error || 'Something went wrong';
				}
				return;
			}

			success = { id: data.story.id, title: data.story.title };

			// Clear form
			textContent = '';
			urlContent = '';
			imageData = null;
			imageName = '';
			category = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Submit Story — Atlas Daily</title>
</svelte:head>

<div class="animate-fade-in">
	<div class="mb-8">
		<a href="/" class="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
			</svg>
			Back to feed
		</a>
	</div>

	<h1 class="mb-2 text-2xl font-bold tracking-tight text-zinc-100">Submit a Story</h1>
	<p class="mb-8 text-sm text-zinc-500">Paste text, a URL, or upload a screenshot — AI will write the full article.</p>

	<!-- API Key -->
	<div class="mb-6">
		<label for="apikey" class="mb-1.5 block text-sm font-medium text-zinc-400">API Key</label>
		<input
			id="apikey"
			type="password"
			bind:value={apiKey}
			placeholder="Enter your API key"
			class="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
		/>
	</div>

	<!-- Input Mode Tabs -->
	<div class="mb-6 flex gap-1 rounded-xl bg-zinc-900 p-1">
		{#each [
			{ mode: 'text' as const, label: 'Text', icon: '✏️' },
			{ mode: 'url' as const, label: 'URL', icon: '🔗' },
			{ mode: 'image' as const, label: 'Screenshot', icon: '📸' }
		] as tab}
			<button
				onclick={() => { inputMode = tab.mode; error = ''; }}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all {inputMode === tab.mode
					? 'bg-zinc-800 text-zinc-100 shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
			>
				<span>{tab.icon}</span>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Text Input -->
	{#if inputMode === 'text'}
		<div class="mb-6">
			<label for="text-input" class="mb-1.5 block text-sm font-medium text-zinc-400">Paste any text, headline, or description</label>
			<textarea
				id="text-input"
				bind:value={textContent}
				placeholder="Paste a headline, article excerpt, tweet, or any text you want turned into a full article..."
				rows={6}
				class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
			></textarea>
		</div>
	{/if}

	<!-- URL Input -->
	{#if inputMode === 'url'}
		<div class="mb-6">
			<label for="url-input" class="mb-1.5 block text-sm font-medium text-zinc-400">Paste a URL</label>
			<input
				id="url-input"
				type="url"
				bind:value={urlContent}
				placeholder="https://youtube.com/watch?v=... or any article URL"
				class="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
			/>
			{#if autoDetectUrl()}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					{autoDetectUrl()}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Image Upload -->
	{#if inputMode === 'image'}
		<div class="mb-6">
			<label class="mb-1.5 block text-sm font-medium text-zinc-400">Upload a screenshot</label>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				ondragover={(e) => { e.preventDefault(); dragOver = true; }}
				ondragleave={() => { dragOver = false; }}
				ondrop={handleDrop}
				class="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all {dragOver
					? 'border-zinc-500 bg-zinc-800/50'
					: imageData
						? 'border-zinc-700 bg-zinc-900'
						: 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}"
			>
				{#if imageData}
					<div class="p-4 text-center">
						<div class="mb-2 text-3xl">📸</div>
						<p class="text-sm font-medium text-zinc-300">{imageName}</p>
						<p class="mt-1 text-xs text-zinc-500">Image ready for analysis</p>
						<button
							onclick={() => { imageData = null; imageName = ''; }}
							class="mt-3 text-xs text-rose-400 hover:text-rose-300"
						>
							Remove
						</button>
					</div>
				{:else}
					<div class="p-8 text-center">
						<div class="mb-3 text-4xl">📷</div>
						<p class="text-sm text-zinc-400">Drag & drop an image here</p>
						<p class="mt-1 text-xs text-zinc-600">or click to browse</p>
					</div>
				{/if}
				<input
					type="file"
					accept="image/*"
					onchange={handleFileSelect}
					class="absolute inset-0 cursor-pointer opacity-0"
				/>
			</div>
		</div>
	{/if}

	<!-- Category Selector -->
	<div class="mb-6">
		<label for="category" class="mb-1.5 block text-sm font-medium text-zinc-400">Category <span class="text-zinc-600">(optional — AI will auto-detect)</span></label>
		<select
			id="category"
			bind:value={category}
			class="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
		>
			<option value="">Auto-detect</option>
			{#each CATEGORIES as cat}
				<option value={cat}>{CATEGORY_CONFIG[cat].label}</option>
			{/each}
		</select>
	</div>

	<!-- Error -->
	{#if error}
		<div class="animate-fade-in mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
			{error}
		</div>
	{/if}

	<!-- Success -->
	{#if success}
		<div class="animate-fade-in mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
			<p class="text-sm font-medium text-emerald-400">Story generated successfully!</p>
			<p class="mt-1 text-sm text-emerald-400/80">{success.title}</p>
			<a
				href="/story/{success.id}"
				class="mt-2 inline-block text-sm font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
			>
				View story →
			</a>
		</div>
	{/if}

	<!-- Submit Button -->
	<button
		onclick={handleSubmit}
		disabled={submitting}
		class="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-6 py-3.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{#if submitting}
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			Generating article...
		{:else}
			Generate Article
		{/if}
	</button>

	{#if submitting}
		<p class="mt-3 text-center text-xs text-zinc-600">
			This may take 30-60 seconds. AI is writing the article and generating artwork.
		</p>
	{/if}
</div>
