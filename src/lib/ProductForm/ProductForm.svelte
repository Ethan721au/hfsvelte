<script lang="ts">
	import type { CartProvider } from '$lib/cartContext.svelte';
	import Input from '$lib/Input/Input.svelte';
	import { getCollectionProducts } from '$lib/shopify';
	import type { Collection, Product, ProductVariant } from '$lib/shopify/types';
	import { getContext, onMount } from 'svelte';

	const { updateCart } = getContext<CartProvider>('cart');
	let { collection }: { collection: Collection } = $props();
	let collectionProducts: Product[] = $state([]);
	let value: string = $state('');
	let selectedProduct: Product | undefined = $state(undefined);
	let products: Product[] = $derived(collectionProducts.filter((p) => p.productType === 'product'));
	let productsWithVariants: Product[] = $derived(
		products?.filter((product) => product.variants.length > 1)
	);
	let productVariants: ProductVariant[] | undefined = $derived(
		productsWithVariants.find((p) => p.title === selectedProduct?.title)?.variants
	);
	let addOns = $derived(collectionProducts?.filter((p) => p.productType === 'add-on')[0]?.variants);

	const handleSubmit = (event: Event) => {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const items = Object.fromEntries(formData.entries());
		console.log(items, 'items');
	};

	onMount(async () => {
		if (collection) {
			collectionProducts = await getCollectionProducts({ collection: collection.handle });
		}
	});
</script>

<!-- {#snippet figure(collection)}
	<Input
		type="text"
		name={collection?.title}
		bold
		label={`${collection?.title} *`}
		selectedProduct={selectedProduct?.title || ''}
		onChange={(product) => {
			selectedProduct = product.find((p) => p.title === (product as string));
		}}
		options={products}
	/>
{/snippet} -->

<div>
	<form onsubmit={handleSubmit}>
		<input type="hidden" name="collection" value={collection?.handle} />
		{#if collection.title === 'Send-in item' && products}
			<div style="display: flex; flex-direction: column;">
				<Input
					type="text"
					name={collection?.title}
					bold
					label={`${collection?.title} *`}
					selectedProduct={selectedProduct?.title || ''}
					onChange={(product) => {
						const productTitle = product as string;
						selectedProduct = product.find((p) => p.title === productTitle);
					}}
					options={products}
				/>
				<!-- {#if productVariants}
					<Input
						type="text"
						label={`${productVariants[0]?.selectedOptions[0]?.name} *`}
						name="variant"
						bold
						bind:selectedVariant={selectedVariant?.title}
						on:change={(event) => {
							selectedVariant = productVariants.find((v) => v.title === event.detail);
						}}
						{productVariants}
					/>
				{/if} -->
			</div>
		{/if}
		<button type="submit">Click me</button>
	</form>
</div>
