import { getContext } from 'svelte';
import type { Attributes, Cart, CartItem, Product, ProductVariant } from './shopify/types';

export const addCartItem = (
	variant: ProductVariant,
	product: Product,
	attributes: Attributes[]
) => {
	console.log('sdfsfsd');
};

type UpdateType = 'plus' | 'minus' | 'delete';

export type CartProvider = {
	cart: Cart;
	addCartItem: (variant: ProductVariant, product: Product, attributes: Attributes[]) => void;
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

export const cartContext = (
	variant: ProductVariant,
	product: Product,
	attributes: Attributes[]
) => {
	const { cart } = getContext<CartProvider>('cart');
	// 	const newCart = cartReducer({ type: 'ADD_ITEM', payload: { variant, product, attributes } });
	// let cart = $state(cartServer);

	const cartReducer = (action: CartAction) => {
		const currentCart = cart;

		switch (action.type) {
			case 'ADD_ITEM': {
				const { variant, product, attributes } = action.payload;
				const existingItem = currentCart?.lines.find((item) => item.merchandise.id === variant.id);
				const updatedItem = createOrUpdateCartItem(existingItem, variant, product, attributes);

				const updatedLines = existingItem
					? cart?.lines.map((item) => (item.merchandise.id === variant.id ? updatedItem : item))
					: [...currentCart.lines, updatedItem];

				const updatedCart = {
					...currentCart,
					...updateCartTotals(updatedLines),
					lines: updatedLines
				};

				return updatedCart;
			}
			default:
				return currentCart;
		}
	};

	function createOrUpdateCartItem(
		existingItem: CartItem | undefined,
		variant: ProductVariant,
		product: Product,
		attributes: Attributes[]
	): CartItem {
		const quantity = existingItem ? existingItem.quantity + 1 : 1;
		const totalAmount = calculateItemCost(quantity, variant.price.amount);

		return {
			id: existingItem?.id,
			quantity,
			attributes: product.productType === 'add-on' ? attributes : [],
			cost: {
				totalAmount: {
					amount: totalAmount,
					currencyCode: variant.price.currencyCode
				}
			},
			merchandise: {
				id: variant.id,
				title: variant.title,
				selectedOptions: variant.selectedOptions,
				product: {
					id: product.id,
					handle: product.handle,
					title: product.title,
					featuredImage: product.featuredImage
				}
			}
		};
	}

	function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
		const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
		const totalAmount = lines.reduce((sum, item) => sum + Number(item.cost.totalAmount.amount), 0);

		const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? 'USD';

		return {
			totalQuantity,
			cost: {
				subtotalAmount: { amount: totalAmount.toString(), currencyCode },
				totalAmount: { amount: totalAmount.toString(), currencyCode },
				totalTaxAmount: { amount: '0', currencyCode }
			}
		};
	}

	function calculateItemCost(quantity: number, price: string): string {
		return (Number(price) * quantity).toString();
	}

	// const addCartItem = (variant: ProductVariant, product: Product, attributes: Attributes[]) => {
	// 	const newCart = cartReducer({ type: 'ADD_ITEM', payload: { variant, product, attributes } });
	// 	console.log('newCart', newCart);
	// 	cart = newCart;
	// 	console.log(cart, 'cart');
	// };

	return { cart };
};
