import { createCart, getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { writable, type Writable } from 'svelte/store';
import { updateCartTotals } from './actions';
import type { Cart } from '$lib/shopify/types';

const emptyCart: Cart = {
	id: '',
	checkoutUrl: '',
	totalQuantity: 0,
	lines: [],
	cost: {
		subtotalAmount: { amount: '0', currencyCode: 'USD' },
		totalAmount: { amount: '0', currencyCode: 'USD' },
		totalTaxAmount: { amount: '0', currencyCode: 'USD' }
	}
};

export const cart: Writable<Cart> = writable(emptyCart);
export const isCartEdit = writable(false);
export const isCartUpdate = writable(false);

export const fetchOrCreateCart = async (cookies: Cookies) => {
	const cartId = cookies.get('cartId');

	if (cartId) {
		let cart = await getCart(cartId);

		if (cart) {
			const { totalQuantity } = updateCartTotals(cart.lines);
			cart = { ...cart, totalQuantity };
			return cart;
		}
	} else {
		const cart = await createCartAndSetCookie(cookies);
		if (cart) {
			return cart;
		}
	}
};

export async function createCartAndSetCookie(cookies: Cookies) {
	const cart = await createCart();
	cookies.set('cartId', cart.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		maxAge: 600 * 60
	});
	return cart;
}
