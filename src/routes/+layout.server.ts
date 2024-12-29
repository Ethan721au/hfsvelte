import { createCart, getCart } from '$lib/shopify';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	let cart = null;
	const cartId = cookies.get('cartId');
	console.log(cartId, 'cartId');

	if (cartId) {
		const cart = await getCart(cartId);
		if (cart) {
			return { cart };
		}
	} else {
		cart = await createCart();
		cookies.set('cartId', cart.id!, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 600 * 60
		});
		return { cart };
	}
};
