<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { PageData } from './$types';
	import '../styles/global.css';
	import Header from '$lib/Header/Header.svelte';
	import { cartContext } from '$lib/cartContext.svelte';

	let { children, data }: { children: Snippet; data: PageData } = $props();
	setContext('cart', cartContext(data.cart));
</script>

<div>
	<Header />
	<div style="padding-top: 72px;">{@render children()}</div>
</div>
