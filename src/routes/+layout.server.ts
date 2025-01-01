import { createCartAndSetCookie, updateCartTotals } from '$lib/Cart/actions';
import { getCart } from '$lib/shopify';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cartId');

	if (cartId) {
		const cart = await getCart(cartId);

		if (cart) {
			const { totalQuantity } = updateCartTotals(cart.lines);
			const updatedCart = { ...cart, totalQuantity };
			console.log('updatedCart', updatedCart);
			return { cart };
		}
	} else {
		const cart = await createCartAndSetCookie(cookies);
		if (cart) {
			return { cart };
		}
	}
};
