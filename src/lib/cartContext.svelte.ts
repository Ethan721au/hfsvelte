import type { Attributes, Cart, Product, ProductVariant } from './shopify/types';

type UpdateType = 'plus' | 'minus' | 'delete';

export type CartProvider = {
	cart: Cart;
	updateCart: (variant: ProductVariant, product: Product, attributes: Attributes[]) => void;
};

type CartAction =
	| {
			type: 'UPDATE_ITEM';
			payload: { merchandiseId: string; updateType: UpdateType };
	  }
	| {
			type: 'ADD_ITEM';
			payload: {
				variant: ProductVariant;
				product: Product;
				attributes: Attributes[];
			};
	  };

export const cartContext = (cartServer: Cart | undefined) => {
	let cart = $state(cartServer);

	const cartReducer = (action: CartAction) => {};

	const updateCart = (variant: ProductVariant, product: Product, attributes: Attributes[]) => {
		cartReducer({ type: 'ADD_ITEM', payload: { variant, product, attributes } });
	};

	return { cart, updateCart };
};
