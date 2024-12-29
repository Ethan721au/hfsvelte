<script lang="ts">
	import type { Cart } from '$lib/shopify/types';
	import { getContext } from 'svelte';
	const cart = getContext<Cart | undefined>('cart');
	console.log(cart, 'cart');
	const handleIncrement = () => {
		if (cart) {
			cart.totalQuantity += 1;
		}
	};
</script>

<button on:click={handleIncrement}>increment</button>
