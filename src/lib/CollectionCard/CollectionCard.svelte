<script lang="ts">
	import Button from '$lib/Button/Button.svelte';
	import { getCollectionProducts } from '$lib/shopify';
	import type { Collection, Product } from '$lib/shopify/types';
	import { onMount } from 'svelte';

	type ProductFormProps = {
		collection: Collection;
	};

	let { collection }: ProductFormProps = $props();
	let products: Product[] | undefined = $state(undefined);

	const findLowestPriceVariant = () => {
		const priceRanges = products?.map((product) => product.priceRange);
		const lowestPriceVariant = priceRanges?.reduce((lowest, current) => {
			return parseFloat(current.minVariantPrice.amount) < parseFloat(lowest.minVariantPrice.amount)
				? current
				: lowest;
		});

		return lowestPriceVariant?.minVariantPrice.amount;
	};

	onMount(async () => {
		products = (await getCollectionProducts({ collection: collection.handle })).filter(
			(product) => product.handle !== 'add-ons'
		);
	});
</script>

<div class="collection-card-wrapper">
	<div class="collection-card-text-wrapper">
		<div class="collection-card-title">{collection.title}</div>
		<div class="collection-card-description">{collection.description}</div>
	</div>
	<div class="collection-card-price-wrapper">
		<div class="collection-card-price-text">from</div>
		{#if products}
			<div class="collection-card-price-amount">
				{`$${Math.round(Number(findLowestPriceVariant()))}`}
			</div>
		{/if}
	</div>
	<Button link={collection.handle} />
</div>

<style>
	.collection-card-wrapper {
		border: 1px solid #e5e5e5;
		border-radius: 24px;
		height: 100%;
		width: 100%;
		max-width: 416px;
		padding: 104px 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		flex: 1;
	}

	.collection-card-text-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-align: center;
	}

	.collection-card-title {
		font-size: 23px;
		font-weight: 700;
		line-height: 28px;
	}

	.collection-card-description {
		font-size: 14px;
		font-weight: 400;
		line-height: 150%;
	}

	.collection-card-price-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 32px 16px;
		background: var(--Background---background-accent-peach-subtlest, #ffefe9);
		border-radius: 16px;
		text-align: center;
	}

	.collection-card-price-text {
		font-size: 14px;
		font-weight: 500;
		line-height: 120%;
	}

	.collection-card-price-amount {
		font-size: 36px;
		font-weight: 700;
		line-height: 36px;
		letter-spacing: -0.72px;
	}
</style>
