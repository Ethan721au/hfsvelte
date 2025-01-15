import { getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { writable, type Writable } from 'svelte/store';
import { createCartAndSetCookie, updateCartTotals } from './actions';
import type { Cart } from '$lib/shopify/types';

const emptyCart: Cart = {
	id: undefined,
	checkoutUrl: '',
	totalQuantity: 0,
	attributes: [],
	lines: [],
	cost: {
		subtotalAmount: { amount: '0', currencyCode: 'USD' },
		totalAmount: { amount: '0', currencyCode: 'USD' },
		totalTaxAmount: { amount: '0', currencyCode: 'USD' }
	}
};

export const cartTesting2: Writable<Cart> = writable(emptyCart);

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
