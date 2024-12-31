<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { PageData } from './$types';
	import '../styles/global.css';
	import Header from '$lib/Header/Header.svelte';
	import type { Cart } from '$lib/shopify/types';

	export type CartContext = { cart: Cart };

	let { children, data }: { children: Snippet; data: PageData } = $props();
	let cart = $state(data.cart);

	setContext('cart', { cart });
</script>

<div>
	<Header />
	<div style="padding-top: 72px;">{@render children()}</div>
</div>
