<script lang="ts">
	import type { CartItem, Product } from '$lib/shopify/types';
	import { getContext } from 'svelte';
	import type { CartContext } from '../+layout.svelte';
	import { addOnsKeys } from '$lib/constants';

	let { cart } = getContext<CartContext>('cart');

	let products: CartItem[] = $derived(
		cart?.lines.filter((line) => !addOnsKeys.includes(line.merchandise.title))
	);
</script>

<main>
	<div class="cart-page-wrapper">
		<a href="/">
			<strong>Home</strong>
		</a>
		{#if products.length > 0}
			{#each products as product}
				<div class="product-section">
					<div>
						<p>{product.merchandise.product.title}</p>
						<p>{product.merchandise.title}</p>
						{#each product.attributes as attribute}
							<p>{attribute.key}: {attribute.value}</p>
						{/each}
						<p>{product.quantity}</p>
					</div>
					<button>Edit item</button>
				</div>
			{/each}
		{:else}
			<p>Your cart is empty</p>
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
</style>
