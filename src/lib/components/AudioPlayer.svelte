<script lang="ts">
	import { browser } from '$app/environment';

	let { src }: { src: string } = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let speed = $state(1);

	const speeds = [0.75, 1, 1.25, 1.5, 2];

	function togglePlay() {
		if (!audio) return;
		if (playing) {
			audio.pause();
		} else {
			audio.play();
		}
		playing = !playing;
	}

	function seek(e: Event) {
		if (!audio) return;
		const target = e.target as HTMLInputElement;
		audio.currentTime = parseFloat(target.value);
	}

	function skip(seconds: number) {
		if (!audio) return;
		audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
	}

	function cycleSpeed() {
		const idx = speeds.indexOf(speed);
		const next = speeds[(idx + 1) % speeds.length];
		speed = next;
		if (audio) audio.playbackRate = next;
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		if (audio) audio.playbackRate = speed;
	});
</script>

{#if browser}
	<div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
		<audio
			bind:this={audio}
			{src}
			ontimeupdate={() => { if (audio) currentTime = audio.currentTime; }}
			onloadedmetadata={() => { if (audio) duration = audio.duration; }}
			onended={() => { playing = false; }}
		></audio>

		<!-- Progress bar -->
		<div class="mb-3">
			<input
				type="range"
				min="0"
				max={duration || 0}
				value={currentTime}
				oninput={seek}
				class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-zinc-100"
			/>
			<div class="mt-1 flex justify-between text-xs text-zinc-500">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>

		<!-- Controls -->
		<div class="flex items-center justify-center gap-4">
			<!-- Speed -->
			<button
				onclick={cycleSpeed}
				class="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
			>
				{speed}x
			</button>

			<!-- Skip back -->
			<button
				onclick={() => skip(-15)}
				class="flex items-center justify-center text-zinc-400 transition-colors hover:text-zinc-200"
				aria-label="Skip back 15 seconds"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
				</svg>
				<span class="ml-0.5 text-[10px] font-bold">15</span>
			</button>

			<!-- Play/Pause -->
			<button
				onclick={togglePlay}
				class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-transform hover:scale-105 active:scale-95"
			>
				{#if playing}
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6zM14 4h4v16h-4z" />
					</svg>
				{:else}
					<svg class="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				{/if}
			</button>

			<!-- Skip forward -->
			<button
				onclick={() => skip(15)}
				class="flex items-center justify-center text-zinc-400 transition-colors hover:text-zinc-200"
				aria-label="Skip forward 15 seconds"
			>
				<span class="mr-0.5 text-[10px] font-bold">15</span>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
				</svg>
			</button>

			<!-- Spacer to balance layout -->
			<div class="w-8"></div>
		</div>
	</div>
{/if}
