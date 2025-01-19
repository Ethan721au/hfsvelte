import { addToCart, createCart, getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { get, writable, type Writable } from 'svelte/store';
// import { updateCartTotals } from './actions';
import type {
	AddOnVariant,
	Attributes,
	Cart,
	CartItem,
	Collection,
	Product,
	ProductVariant
} from '$lib/shopify/types';
import { addOnsKeys } from '$lib/constants';

// export type AddOn = {
// 	addOn: ProductVariant;
// 	id: string;
// 	title: string;
// 	checked: boolean;
// 	value: FormDataEntryValue;
// };

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

export function createOrUpdateCartItem(
	variant: ProductVariant,
	product: Product,
	existingItem?: CartItem,
	attributes?: Attributes[],
	quantity?: number
): CartItem {
	const updatedQuantity = existingItem ? existingItem.quantity + quantity! : 1;
	const totalAmount = calculateItemCost(updatedQuantity, variant.price.amount);

	return {
		id: existingItem?.id ?? '',
		quantity: updatedQuantity,
		attributes: attributes || [],
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

export const addItemtoCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOnVariant[],
	addOn: Product,
	collection: Collection
) => {
	console.log(selectedAddOns, 'selectedAddOns');
	console.log(selectedVariant, 'selectedVariant');
	console.log(selectedProduct, 'selectedProduct');
	// addItemtoFrontEndCart(selectedProduct, selectedVariant, selectedAddOns, addOns, collection);

	const productVariant = selectedVariant || selectedProduct.variants[0];

	console.log(productVariant, 'productVariant');

	const addOns = selectedAddOns.map((addOn) => {
		return { merchandiseId: addOn.id, quantity: 1, attributes: [] };
	});

	const attributes = [
		{ key: 'Order type', value: collection.title },
		...selectedAddOns.map((addOn) => {
			return { key: addOn.title, value: addOn.value || '' };
		})
	];

	const product = {
		merchandiseId: selectedVariant?.id || selectedProduct.variants[0].id,
		quantity: 1,
		attributes
	};

	let updatedCart = await addItemtoShopifyCart(get(cart), [product, ...addOns]);

	if (typeof updatedCart === 'string') {
		console.error('Failed to update the cart:', updatedCart);
		return;
	}

	const { totalQuantity } = updateCartTotals(updatedCart.lines);

	updatedCart = { ...updatedCart, totalQuantity };

	cart.set(updatedCart as Cart);

	isCartUpdate.set(false);
};

export async function addItemtoShopifyCart(
	cart: Cart,
	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
): Promise<Cart | string> {
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
