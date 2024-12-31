<script lang="ts">
	import { getContext } from 'svelte';
	import type { CartContext } from './+layout.svelte';
	const { cart } = getContext<CartContext>('cart');
	console.log(cart, 'cart');
	const handleIncrement = () => {
		if (cart) {
			cart.totalQuantity += 1;
		}
	};
</script>

<button on:click={handleIncrement}>increment</button>
