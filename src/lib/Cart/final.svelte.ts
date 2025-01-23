import type {
	AddOnVariant,
	Attributes,
	Cart,
	CartItem,
	Product,
	ProductVariant
} from '$lib/shopify/types';
import { get, writable, type Writable } from 'svelte/store';
// import { cart } from './context.svelte';
import { priceFormatter } from '$lib';
import { addToCart, createCart, editCartItem, getCart, removeFromCart } from '$lib/shopify';
import { addOnsKeys } from '$lib/constants';
import type { Cookies } from '@sveltejs/kit';

export type UpdateType = 'plus' | 'minus' | 'delete' | 'edit' | 'add';

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

// type Line = {
// 	id: string;
// 	merchandiseId: string;
// 	quantity: number;
// 	attributes: { key: string; value: FormDataEntryValue }[];
// };

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

export function calculateItemCost(quantity: number, price: string): string {
	return (Number(price) * quantity).toString();
}

export function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
	const products = lines.filter((line) => !addOnsKeys.includes(line.merchandise.title));

	const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

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

export function createNewItem(variant: ProductVariant) {
	const quantity = 1;
	const totalAmount = calculateItemCost(quantity, variant.price.amount);
	const newItem = {
		id: '',
		quantity,
		attributes: variant.attributes,
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
				id: variant.product?.id ?? '',
				handle: variant.product?.handle ?? '',
				title: variant.product?.title ?? '',
				featuredImage: undefined
			}
		}
	};

	const lines = [...get(cart).lines, newItem];

	const { totalQuantity, cost } = updateCartTotals(lines);

	const updatedCart = {
		...get(cart),
		lines,
		totalQuantity,
		cost
	};

	cart.set(updatedCart);

	return {
		merchandiseId: newItem.merchandise.id,
		quantity: newItem.quantity,
		attributes: newItem.attributes
	};
}

export const editCartItemQty = (cartItem: CartItem, qty: number) => {
	const newQty = cartItem.quantity + qty;

	let lines = get(cart).lines;

	const updateCart = (lines: CartItem[]) => {
		const { totalQuantity, cost } = updateCartTotals(lines);

		const updatedCart = {
			...get(cart),
			lines,
			totalQuantity,
			cost
		};

		cart.set(updatedCart);
	};

	if (newQty <= 0) {
		lines = lines.filter((line) => line.id !== cartItem.id);
		updateCart(lines);
		return {
			status: 'removed',
			value: cartItem.id
		};
	} else {
		const updatedItem = {
			...cartItem,
			quantity: newQty,
			cost: {
				totalAmount: {
					amount: calculateItemCost(
						newQty,
						(Number(cartItem.cost.totalAmount.amount) / cartItem.quantity).toString()
					),
					currencyCode: cartItem.cost.totalAmount.currencyCode
				}
			}
		};

		lines = lines.map((item) => (item.id === updatedItem.id ? updatedItem : item));
		updateCart(lines);
		return {
			status: 'updated',
			value: {
				id: updatedItem.id,
				merchandiseId: updatedItem.merchandise.id,
				quantity: updatedItem.quantity,
				attributes: updatedItem.attributes
			}
		};
	}
};

export const testaddItemToCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOnVariant[]
) => {
	const newItems = [];
	const editItems = [];

	const updatedAddOns = selectedAddOns.map((addOn) => {
		return {
			...addOn,
			attributes: []
		};
	});

	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...updatedAddOns.map((addOn) => ({
			key: addOn.title,
			value: `${addOn.value} (+${priceFormatter(addOn.price.amount, 0)})`
		}))
	];

	const productVariant = selectedVariant
		? { ...selectedVariant, product: selectedProduct }
		: { ...selectedProduct.variants[0], product: selectedProduct };

	const cartItemsToCreate = [...updatedAddOns, { ...productVariant, attributes }];

	cartItemsToCreate.forEach((product) => {
		const existingItem = get(cart).lines.find((item) => {
			if (item.merchandise.id !== product.id) return false;

			return (
				product.attributes.every((addOn) =>
					item.attributes.some((attr) => addOn.key === attr.key && addOn.value === attr.value)
				) &&
				item.attributes.every((attr) =>
					product.attributes.some((addOn) => addOn.key === attr.key && addOn.value === attr.value)
				)
			);
		});

		if (existingItem) {
			const editedItem = editCartItemQty(existingItem, 1);
			if (editedItem.status === 'updated') {
				editItems.push(editedItem.value);
			} else {
				console.log('error');
			}
		} else {
			const newItem = createNewItem(product);
			newItems.push(newItem);
		}
	});

	let updatedCart = get(cart);

	updatedCart = (await addItemToShopifyCart(cart, newItems)) as Cart;
	updatedCart = (await editCartItemInShopifyCart(cart, editItems)) as Cart;

	cart.set(updatedCart as Cart);
};

export const editItemFromCart = async (cartItem: CartItem, qty: number) => {
	const itemsToRemove = [];

	const editItems = [];

	const addOns = get(cart).lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	const cartItems = [cartItem, ...addOns];

	cartItems.forEach((product) => {
		const editedItem = editCartItemQty(product, qty);
		if (editedItem.status === 'updated') {
			editItems.push(editedItem.value);
		} else if (editedItem.status === 'removed') {
			itemsToRemove.push(editedItem.value);
		} else {
			console.log('error');
		}
	});

	let updatedCart = get(cart);

	updatedCart = (await removeItemFromShopifyCart(cart, itemsToRemove)) as Cart;
	updatedCart = (await editCartItemInShopifyCart(cart, editItems)) as Cart;
	cart.set(updatedCart as Cart);
};

export async function addItemToShopifyCart(
	cart: Writable<Cart>,
	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
): Promise<Cart | string> {
	if (!get(cart).id || !lines) {
		return 'Error adding item to cart';
	}

	try {
		let updatedCart = await addToCart(get(cart).id, lines);

		const { totalQuantity } = updateCartTotals(updatedCart.lines);

		updatedCart = { ...updatedCart, totalQuantity };

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error adding item to cart';
	}
}

export async function editCartItemInShopifyCart(
	cart: Writable<Cart>,
	lines: { id: string; merchandiseId: string; quantity: number; attributes: Attributes[] }[]
): Promise<Cart | string> {
	if (!get(cart).id || !lines) {
		return 'Error editing item in cart';
	}

	try {
		let updatedCart = await editCartItem(get(cart).id, lines);

		const { totalQuantity } = updateCartTotals(updatedCart.lines);

		updatedCart = { ...updatedCart, totalQuantity };

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error editing item in cart';
	}
}

export async function removeItemFromShopifyCart(
	cart: Writable<Cart>,
	lineIds: string[]
): Promise<Cart | string> {
	if (!get(cart).id || !lineIds) {
		return 'Error removing item from cart';
	}

	try {
		let updatedCart = await removeFromCart(get(cart).id, lineIds);

		const { totalQuantity } = updateCartTotals(updatedCart.lines);

		updatedCart = { ...updatedCart, totalQuantity };

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error removing item from cart';
	}
}
