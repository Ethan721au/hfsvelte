<script lang="ts">
	import type { CartProvider } from '$lib/cartContext.svelte';
	import { getContext } from 'svelte';
	const { cart } = getContext<CartProvider>('cart');
	console.log(cart, 'cart');
	const handleIncrement = () => {
		if (cart) {
			cart.totalQuantity += 1;
		}
	};
</script>

<button on:click={handleIncrement}>increment</button>
