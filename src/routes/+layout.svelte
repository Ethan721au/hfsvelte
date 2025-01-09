<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { PageData } from './$types';
	import '../styles/global.css';
	import Header from '$lib/Header/Header.svelte';
	import type { Cart } from '$lib/shopify/types';
	import DynamicOverlay from '$lib/DynamicOverlay/DynamicOverlay.svelte';
	import { writable, type Writable } from 'svelte/store';

	export type CartContext = { cart: Writable<Cart>; isCartEdit: Writable<boolean> };

	let { children, data }: { children: Snippet; data: PageData } = $props();
	const cart = writable(data.cart);
	const isCartEdit = writable(false);

	setContext('cart', { cart, isCartEdit });
</script>

<div>
	<DynamicOverlay />
	<Header />
	<div style="padding-top: 72px;">{@render children()}</div>
</div>
