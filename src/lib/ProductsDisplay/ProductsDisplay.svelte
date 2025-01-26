<script lang="ts">
	import CollectionCard from '$lib/CollectionCard/CollectionCard.svelte';
	import { getCollections } from '$lib/shopify';
	import type { Collection } from '$lib/shopify/types';
	import { onMount } from 'svelte';

	let collections: Collection[] = $state([]);

	onMount(async () => {
		collections = (await getCollections()).filter((collection) => collection.title !== 'All');
	});
</script>

<div class="products-display-wrapper">
	<div class="products-display-title">Lorem ipsum dolor</div>
	<div class="products-display-subtitle">
		Lorem ipsum dolor sit amet, consectetur adipiscing eli
	</div>
	<div class="product-card-wrapper">
		{#if collections}
			{#each collections as collection}
				<CollectionCard {collection} />
			{/each}
		{/if}
	</div>
</div>

<style>
	.products-display-wrapper {
		padding: 32px 40px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
	}

	.products-display-title {
		color: var(--Text---text, rgba(27, 27, 27, 0.99));
		text-align: center;
		font-size: 66px;
		font-weight: 700;
		line-height: 110%;
		letter-spacing: -1.32px;
	}

	.products-display-subtitle {
		color: var(--Text---text-subtle, rgba(27, 27, 27, 0.99));
		text-align: center;
		max-width: 768px;
		font-size: 20px;
		font-weight: 400;
		line-height: 150%;
	}

	.product-card-wrapper {
		display: flex;
		justify-content: center;
		gap: 16px;
		width: 100%;
	}
</style>
