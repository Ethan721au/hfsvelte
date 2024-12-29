import type { Cart } from './shopify/types';

export type CartProvider = {
	cart: Cart;
	updateCart: (value: string) => void;
};

export const cartContext = (cartServer: Cart | undefined) => {
	let cart = $state(cartServer);

	const updateCart = (value: number) => {
		console.log('updateCart', value);
		if (cart) {
			cart.totalQuantity = value;
		}
	};

	return { cart, updateCart };
};
