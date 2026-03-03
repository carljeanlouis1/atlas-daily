<script lang="ts">
	import { browser } from '$app/environment';

	let { src }: { src: string } = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);

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

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

{#if browser}
	<div class="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
		<audio
			bind:this={audio}
			{src}
			ontimeupdate={() => { if (audio) currentTime = audio.currentTime; }}
			onloadedmetadata={() => { if (audio) duration = audio.duration; }}
			onended={() => { playing = false; }}
		></audio>

		<button
			onclick={togglePlay}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-transform hover:scale-105"
		>
			{#if playing}
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M6 4h4v16H6zM14 4h4v16h-4z" />
				</svg>
			{:else}
				<svg class="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z" />
				</svg>
			{/if}
		</button>

		<div class="flex flex-1 flex-col gap-1">
			<input
				type="range"
				min="0"
				max={duration || 0}
				value={currentTime}
				oninput={seek}
				class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-zinc-100"
			/>
			<div class="flex justify-between text-xs text-zinc-500">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>
	</div>
{/if}
