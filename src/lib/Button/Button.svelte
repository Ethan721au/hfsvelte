<script lang="ts">
	let { link }: { link: string } = $props();
</script>

<a href={`/${link}`} class="button-wrapper" target="_blank">
	Buy
	<img src="/arrowRight.svg" alt="" />
</a>

<style>
	.button-wrapper {
		border: none;
		border-radius: 36px;
		padding: 0 24px;
		cursor: pointer;
		height: 52px;
		background-color: var(--Surface-Background---surface-accent, #ffb593);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-top: 24px;
		font-size: 18px;
		font-weight: 700;
		line-height: 22px;
		color: black;
		transition: all 0.2s ease-in-out;
	}

	.button-wrapper:hover {
		background-color: var(--Surface-Background---surface-accent-hover, #ff9f7e);
	}
</style>
