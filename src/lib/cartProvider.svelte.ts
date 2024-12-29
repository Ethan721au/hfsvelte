import type { Cart } from './shopify/types';

export const cartProvider = (cartServer: Cart | undefined) => {
	let cart = $state(cartServer);
	return cart;
};
