<script lang="ts">
	import type { CartProvider } from '$lib/cartContext.svelte';
	import type { Collection } from '$lib/shopify/types';
	import { getContext } from 'svelte';

	export let collection: Collection;
	let value: string = '';
	const { updateCart } = getContext<CartProvider>('cart');

	console.log(collection, 'collection');
	const handleSubmit = (event: Event) => {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		value = formData.get('value') as string;
		updateCart(value);
	};
</script>

<div>
	<form on:submit={handleSubmit}>
		<input type="text" name="value" />
		<button type="submit">Click me</button>
	</form>
</div>

<p>Entered value: {value}</p>
