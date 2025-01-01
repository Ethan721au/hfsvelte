<script lang="ts">
	import { getContext } from 'svelte';
	import type { CartContext } from './+layout.svelte';
	let { cart } = getContext<CartContext>('cart');
	const handleIncrement = () => {
		if (cart) {
			cart.totalQuantity += 1;
		}
	};
</script>

<p>{cart.totalQuantity}</p>
<button on:click={handleIncrement}>increment</button>
