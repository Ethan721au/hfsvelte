import { fetchOrCreateCart } from '$lib/Cart/final.svelte';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cart = await fetchOrCreateCart(cookies);

	return { cart };
};
