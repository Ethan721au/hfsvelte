<script lang="ts">
	import { video } from '$lib/constants';
	import { isMobile } from '$lib/useWindowSize.svelte';

	const initialVideoSize = {
		clipPath: 'inset(0%)',
		matrix: 'matrix(1, 0, 0, 1, 0, 0)'
	};

	const videoSize = $state(initialVideoSize);

	/// replace $effect with onMount

	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', adjustVideoSize);

			return (): void => {
				window.removeEventListener('scroll', adjustVideoSize);
			};
		}
	});

	const adjustVideoSize = () => {
		const scrollY = window.scrollY;
		const scrollLimit = 500;

		if (scrollY < scrollLimit) {
			const newClipPath = `inset(${6.25 * (scrollY / scrollLimit)}% round ${40 * (scrollY / scrollLimit)}px)`;
			const newMatrix = `matrix(${1 - 0.05 * (scrollY / scrollLimit)}, 0, 0, ${1 - 0.05 * (scrollY / scrollLimit)}, 0, 0)`;
			videoSize.clipPath = newClipPath;
			videoSize.matrix = newMatrix;
		}
	};
</script>

<div
	class="main-page-wrapper"
	style={`--clipPath: ${videoSize.clipPath}; --matrix: ${videoSize.matrix}`}
>
	<div class="video-overlay"></div>
	<video src={$isMobile ? video.mobile : video.desktop} class="video-container" autoplay loop muted
	></video>
	<div class="main-page-text-wrapper">
		<div class="main-page-title">Hugh Jackman</div>
		<div class="main-page-subtitle">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros
			elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut
			commodo diam libero vitae erat.
		</div>
	</div>
</div>

<style>
	.main-page-wrapper {
		--min-height: 600px;
		--max-height: 960px;
		--clipPath: 'inset(0%)';
		z-index: 0;
		display: flex;
		-webkit-box-align: center;
		align-items: center;
		-webkit-box-pack: center;
		justify-content: center;
		isolation: isolate;
		position: relative;
		height: clamp(var(--min-height), -360px + 80vw, var(--max-height));
		clip-path: var(--clipPath);
	}

	.video-container {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		object-fit: cover;
		z-index: 0;
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
		background-image: linear-gradient(
			270deg,
			#0000 16% 27%,
			#0003 36%,
			#0000006b 45%,
			#00000085 51%,
			#0009 58%,
			#000000ab 64%,
			#000000bf 72%,
			#000000d4 83%,
			#000000e0
		);
		animation: 2s ease 0s 1 normal none running fadein;
		height: 100%;
		width: 100%;
	}

	.main-page-text-wrapper {
		color: #fff;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 32px;
		max-width: 1100px;
	}

	.main-page-title {
		text-align: center;
		font-size: 105px;
		font-weight: 700;
		line-height: 100%;
		letter-spacing: -2.1px;
	}

	.main-page-subtitle {
		text-align: center;
		font-size: 23px;
		font-weight: 700;
		line-height: 120%;
	}
</style>
