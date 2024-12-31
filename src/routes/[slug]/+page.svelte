<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getCollections } from '$lib/shopify';
	import type { Collection } from '$lib/shopify/types';
	import ProductForm from '$lib/ProductForm/ProductForm.svelte';

	let handle = $state(page.params.slug);
	let collections: Collection[] = $state([]);
	let collection: Collection | undefined = $derived(collections.find((c) => c.handle === handle));

	onMount(async () => {
		collections = await getCollections();
	});
</script>

<main>
	{#if collection}
		<ProductForm {collection} isCart />
	{:else}
		<div>loading...</div>
	{/if}
</main>
