<script lang="ts">
	import type { CartItem, Collection } from '$lib/shopify/types';
	import { getContext, onMount } from 'svelte';
	import type { CartContext } from '../+layout.svelte';
	import { addOnsKeys } from '$lib/constants';
	import { priceFormatter } from '$lib';
	import { getCollections } from '$lib/shopify';
	import ProductForm from '$lib/ProductForm/ProductForm.svelte';
	import { incrementCartItem } from '$lib/Cart/actions';
	import { cartTesting2 } from '$lib/Cart/context.svelte';

	const { isCartEdit, isCartUpdating } = getContext<CartContext>('cart');
	let collections: Collection[] = $state([]);
	let collection: Collection | undefined = $state(undefined);
	let cartItem: CartItem | undefined = $state(undefined);
	let cartItems: CartItem[] = $derived(
		$cartTesting2.lines.filter((line) => !addOnsKeys.includes(line.merchandise.title))
	);

	const handleCartEdit = (item: CartItem) => {
		isCartEdit.update(() => true);
		cartItem = item;
		collection = collections.find((c) => item.attributes.some((a) => a.value === c.title));
	};

	const handleIncrement = async (item: CartItem, qty: number) => {
		isCartUpdating.update(() => true);
		const message = await incrementCartItem(item, qty);
		if (message === 'completed') isCartUpdating.update(() => false);
	};

	onMount(async () => {
		collections = await getCollections();
	});

	const calculateTotalCosts = (item: CartItem) => {
		const productCosts = Number(item.cost.totalAmount.amount);

		const addOnLines = $cartTesting2.lines.filter((line) =>
			item.attributes.some((attr) => attr.key === line.merchandise.title)
		);

		const addOnCosts = addOnLines.reduce((acc, line) => {
			const amount = Number(line.cost.totalAmount.amount);
			const quantity = line.quantity || 1;
			return acc + (amount / quantity) * item.quantity;
		}, 0);

		const totalCosts = productCosts + addOnCosts;

		return priceFormatter(totalCosts, 0);
	};
</script>

<main>
	<div class="cart-page-wrapper">
		<a href="/send-in-item">
			<strong>Home</strong>
		</a>
		{#if cartItems.length > 0}
			{#each cartItems as item}
				<div class="product-section">
					<div class="product-details">
						<div>
							<strong>{item.merchandise.product.title}</strong>
							<p>
								{item.merchandise.title === 'Default Title' ? '' : item.merchandise.title}
							</p>
							{#each item.attributes as attribute}
								<p>{attribute.key}: {attribute.value}</p>
							{/each}
						</div>
						<div style="display: flex; gap: 10px;">
							<button onclick={() => handleIncrement(item, 1)} disabled={$isCartUpdating}>+</button>
							<p>{item.quantity}</p>
							<button onclick={() => handleIncrement(item, -1)} disabled={$isCartUpdating}>-</button
							>
						</div>
						<div>{calculateTotalCosts(item)}</div>
					</div>
					<button onclick={() => handleCartEdit(item)} disabled={$isCartUpdating}
						>{$isCartUpdating ? 'Cart is updating...' : 'Edit item'}</button
					>
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
