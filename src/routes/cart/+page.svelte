<script lang="ts">
	import type { CartItem, Collection, Product } from '$lib/shopify/types';
	import { getContext, onMount } from 'svelte';
	import type { CartContext } from '../+layout.svelte';
	import { addOnsKeys } from '$lib/constants';
	import { priceFormatter } from '$lib';
	import { getCollections } from '$lib/shopify';
	import ProductForm from '$lib/ProductForm/ProductForm.svelte';

	const { cart, isCartEdit } = getContext<CartContext>('cart');
	console.log($isCartEdit, 'isCartEdit');
	let collections: Collection[] = $state([]);
	let collection: Collection | undefined = $state(undefined);
	let cartItem: CartItem | undefined = $state(undefined);

	console.log(cart, 'cart');

	let cartItems: CartItem[] = $derived(
		cart?.lines.filter((line) => !addOnsKeys.includes(line.merchandise.title))
	);

	const handleCartEdit = (item: CartItem) => {
		isCartEdit.update(() => true);
		cartItem = item;
		collection = collections.find((c) => item.attributes.some((a) => a.value === c.title));
	};
	onMount(async () => {
		collections = await getCollections();
	});
</script>

<main>
	<div class="cart-page-wrapper">
		<a href="/">
			<strong>Home</strong>
		</a>
		{#if cartItems.length > 0}
			{#each cartItems as item}
				<div class="product-section">
					<div class="product-details">
						<div>
							<strong>{item.merchandise.product.title}</strong>
							<p>{item.merchandise.title}</p>
							{#each item.attributes as attribute}
								<p>{attribute.key}: {attribute.value}</p>
							{/each}
						</div>
						<div style="display: flex; gap: 10px;">
							<div>+</div>
							<p>{item.quantity}</p>
							<div>-</div>
						</div>
						<div>{priceFormatter(item.cost.totalAmount.amount, 2)}</div>
					</div>
					<button onclick={() => handleCartEdit(item)}>Edit item</button>
				</div>
			{/each}
		{:else}
			<p>Your cart is empty</p>
		{/if}
		{#if $isCartEdit && collection}
			<div class="cart-overlay">
				<ProductForm {collection} {cartItem} />
			</div>
		{/if}
	</div>
</main>

<style>
	.cart-page-wrapper {
		position: relative;
	}

	.product-section {
		padding-top: 36px;
		padding-left: 30px;
		padding-right: 30px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.product-details {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cart-overlay {
		background-color: white;
		position: absolute;
		top: 0;
		left: 50px;
		right: 50px;
		min-height: 600px;
		z-index: 3;
		padding: 20px;
		border-radius: 20px;
	}
</style>
