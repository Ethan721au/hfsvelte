import { addToCart, createCart, getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { get, writable, type Writable } from 'svelte/store';
import { updateCartTotals } from './actions';
import type { Attributes, Cart, Collection, Product, ProductVariant } from '$lib/shopify/types';

export type AddOn = {
	id: string;
	title: string;
	checked: boolean;
	value: FormDataEntryValue;
};

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

export const addItemtoCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[],
	addOn: Product,
	collection: Collection
) => {
	// addItemtoFrontEndCart(selectedProduct, selectedVariant, selectedAddOns, addOns, collection);

	const addOns = selectedAddOns.map((addOn) => {
		return { merchandiseId: addOn.id, quantity: 1, attributes: [] };
	});

	const attributes = [
		{ key: 'Order type', value: collection.title },
		...selectedAddOns.map((addOn) => {
			return { key: addOn.title, value: addOn.value };
		})
	];

	const product = {
		merchandiseId: selectedVariant?.id || selectedProduct.variants[0].id,
		quantity: 1,
		attributes
	};

	const updatedCart = await addItemtoShopifyCart(get(cart), [product, ...addOns]);

	cart.set(updatedCart as Cart);

	isCartUpdate.set(false);
};

export async function addItemtoShopifyCart(
	cart: Cart,
	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
) {
	if (!cart.id || !lines) {
		return 'Error adding item to cart';
	}

	try {
		const updatedCart = await addToCart(cart.id, lines);
		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error adding item to cart';
	}
}
