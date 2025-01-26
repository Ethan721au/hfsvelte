<script lang="ts">
	import { getCollectionProducts } from '$lib/shopify';
	import type { Collection, Product } from '$lib/shopify/types';
	import { onMount } from 'svelte';

	type ProductFormProps = {
		collection: Collection;
	};

	let { collection }: ProductFormProps = $props();
	let products: Product[] = $state([]);

	const findLowestPriceVariant = () => {
		const priceRanges = products.map((product) => product.priceRange);
		const lowestPriceVariant = priceRanges.reduce((lowest, current) => {
			return parseFloat(current.minVariantPrice.amount) < parseFloat(lowest.minVariantPrice.amount)
				? current
				: lowest;
		});

		return lowestPriceVariant.minVariantPrice.amount;
	};

	onMount(async () => {
		products = await getCollectionProducts({ collection: collection.handle });
	});
</script>

<div>dfsdfs</div>

<style>
</style>
