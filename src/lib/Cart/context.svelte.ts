import { getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { createCartAndSetCookie, updateCartTotals } from './actions';
import { writable, type Writable } from 'svelte/store';
import { setContext } from 'svelte';
import type { Cart } from '$lib/shopify/types';

export type CartContext = {
	cartTest: Writable<Cart>;
	// isCartEdit: Writable<boolean>;
	// isCartUpdating: Writable<boolean>;
};

const cartTest = writable();

export const setCartContext = async (cookies: Cookies) => {
	const cartId = cookies.get('cartId');
	if (cartId) {
		let cart = await getCart(cartId);

		if (cart) {
			const { totalQuantity } = updateCartTotals(cart.lines);
			cart = { ...cart, totalQuantity };
			// return cart;
			cartTest.set(cart);
		}
	} else {
		const cart = await createCartAndSetCookie(cookies);
		if (cart) {
			// return { cart };
			cartTest.set(cart);
		}
	}

	setContext('cart2', { cartTest });
};
