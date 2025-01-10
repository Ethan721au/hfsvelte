// import { createCartAndSetCookie, updateCartTotals } from '$lib/Cart/actions';
import { createCartAndSetCookie } from '$lib/Cart/actions';
import { updateCartTotals } from '$lib/Cart/utils';
import { getCart } from '$lib/shopify';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cartId');

	if (cartId) {
		let cart = await getCart(cartId);

		if (cart) {
			const { totalQuantity } = updateCartTotals(cart.lines);
			cart = { ...cart, totalQuantity };
			return { cart };
		}
	} else {
		const cart = await createCartAndSetCookie(cookies);
		if (cart) {
			return { cart };
		}
	}
};
