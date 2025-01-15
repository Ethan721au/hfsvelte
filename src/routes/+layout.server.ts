// import { createCartAndSetCookie } from '$lib/Cart/actions';
import { fetchOrCreateCart } from '$lib/Cart/context.svelte';
// import { updateCartTotals } from '$lib/Cart/utils';
// import { getCart } from '$lib/shopify';
import type { LayoutServerLoad } from './$types';

// export const load: LayoutServerLoad = async ({ cookies }) => {
// 	const cartId = cookies.get('cartId');

// 	if (cartId) {
// 		let cart = await getCart(cartId);

// 		if (cart) {
// 			const { totalQuantity } = updateCartTotals(cart.lines);
// 			cart = { ...cart, totalQuantity };
// 			return { cart };
// 		}
// 	} else {
// 		const cart = await createCartAndSetCookie(cookies);
// 		if (cart) {
// 			return { cart };
// 		}
// 	}
// };

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cart = await fetchOrCreateCart(cookies);
	return { cart };
};
