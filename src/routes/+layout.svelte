<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { PageData } from './$types';
	import '../styles/global.css';
	import Header from '$lib/Header/Header.svelte';
	// import type { Cart } from '$lib/shopify/types';
	import DynamicOverlay from '$lib/DynamicOverlay/DynamicOverlay.svelte';
	// import { writable, type Writable } from 'svelte/store';
	import { cartTesting2 } from '$lib/Cart/context.svelte';

	// update this code with $state: https://svelte.dev/docs/svelte/stores

	// export type CartContext = {
	// 	isCartEdit: Writable<boolean>;
	// 	isCartUpdating: Writable<boolean>;
	// };

	let { children, data }: { children: Snippet; data: PageData } = $props();
	// const cart = writable(data.cart);
	if (data.cart) cartTesting2.set(data.cart);
	// const isCartEdit = writable(false);
	// const isCartUpdating = writable(false);

	// setContext('cart', { isCartUpdating });
</script>

<div>
	<DynamicOverlay />
	<Header />
	<div style="padding-top: 72px;">{@render children()}</div>
</div>
