<script lang="ts">
	import { isCartEdit2 } from '$lib/Cart/context.svelte';

	const handleClick = () => {
		isCartEdit2.set(false);
	};
</script>

<div
	class={`overlay ${$isCartEdit2}`}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleClick;
		}
	}}
></div>

<style>
	.overlay.true {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: grey;
		opacity: 0.7;
		z-index: 3;
	}
</style>
