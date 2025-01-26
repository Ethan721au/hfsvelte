<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { PageData } from './$types';
	import '../styles/global.css';
	import Header from '$lib/Header/Header.svelte';
	import DynamicOverlay from '$lib/DynamicOverlay/DynamicOverlay.svelte';

	import { cart } from '$lib/Cart/final.svelte';
	import { useWindowSize } from '$lib/useWindowSize.svelte';

	let { children, data }: { children: Snippet; data: PageData } = $props();

	if (data.cart) cart.set(data.cart);

	onMount(() => {
		useWindowSize();
	});
</script>

<div>
	<DynamicOverlay />
	<Header />
	<div style="padding-top: 72px;">{@render children()}</div>
</div>
