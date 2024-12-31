import { createCartAndSetCookie } from '$lib/Cart/actions';
import { getCart } from '$lib/shopify';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cartId');

	if (cartId) {
		const cart = await getCart(cartId);
		if (cart) {
			return { cart };
		}
	} else {
		const cart = await createCartAndSetCookie(cookies);
		if (cart) {
			return { cart };
		}
	}
};
