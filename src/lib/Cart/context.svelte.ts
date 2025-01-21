import { addToCart, createCart, getCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { get, writable, type Writable } from 'svelte/store';
import type {
	AddOnVariant,
	Attributes,
	Cart,
	CartItem,
	Product,
	ProductVariant
} from '$lib/shopify/types';
import { addOnsKeys } from '$lib/constants';
import { priceFormatter } from '$lib';

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
	existingItem: CartItem | undefined,
	variant: ProductVariant,
	product?: Product,
	attributes?: Attributes[]
): CartItem {
	const quantity = existingItem ? existingItem.quantity + 1 : 1;
	const totalAmount = calculateItemCost(quantity, variant.price.amount);

	return {
		id: existingItem?.id ?? '',
		quantity,
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
				id: product?.id ?? '',
				handle: product?.handle ?? '',
				title: product?.title ?? '',
				featuredImage: product?.featuredImage ?? undefined
			}
		}
	};
}

const updateAddOns = (selectedAddOns: AddOnVariant[]) => {
	const addOns = selectedAddOns.map((addOn) => {
		const existingAddOn = get(cart).lines.find((item) => item.merchandise.id === addOn.id);

		const updatedAddOn = createOrUpdateCartItem(existingAddOn, addOn);

		return {
			...updatedAddOn,
			key: addOn.title,
			value: `${addOn.value} (+${priceFormatter(addOn.price.amount, 0)})`
		};
	});

	const updatedLines = addOns.reduce((lines, addOn) => {
		const existingItem = lines.find((item) => item.merchandise.id === addOn.id);

		return existingItem
			? lines.map((item) => (item.id === existingItem.id ? addOn : item))
			: [...lines, addOn];
	}, get(cart).lines);

	return { addOns, updatedLines };
};

/////// add item to cart:

export const addItemtoCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOnVariant[]
) => {
	const { addOns, updatedLines } = updateAddOns(selectedAddOns);

	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...addOns.map((addOn) => {
			return {
				key: addOn.key,
				value: addOn.value
			};
		})
	];

	const productVariant = selectedVariant || selectedProduct.variants[0];

	const existingItem = updatedLines.find(
		(item) =>
			item.merchandise.id === productVariant.id &&
			selectedAddOns.every((addOn) =>
				item.attributes.some((attr) => {
					if (typeof attr.value === 'string') {
						const match = attr.value.match(/^(.+?) \(\+\$/);
						return attr.key === addOn.title && match && match[1] === addOn.value;
					}
					return false;
				})
			)
	);

	const updatedItem = createOrUpdateCartItem(
		existingItem,
		productVariant,
		selectedProduct,
		attributes
	);

	const lines = existingItem
		? updatedLines.map((item) => (item.id === existingItem.id ? updatedItem : item))
		: [...updatedLines, updatedItem];

	const { totalQuantity, cost } = updateCartTotals(lines);

	const updatedCart = {
		...get(cart),
		lines,
		totalQuantity,
		cost
	};

	cart.set(updatedCart);

	await addItemtoShopifyCart(cart, [
		{
			merchandiseId: productVariant.id,
			quantity: 1,
			attributes
		},
		...addOns.map((addOn) => {
			return {
				merchandiseId: addOn.merchandise.id,
				quantity: 1,
				attributes: []
			};
		})
	]);
};

export async function addItemtoShopifyCart(
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

		cart.set(updatedCart as Cart);

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error adding item to cart';
	}
}

//////// remove item from cart:

export const removeItemFromCart = async (cartItem: CartItem) => {
	// console.log(cartItem, 'cartItem');

	const addOns = get(cart).lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	console.log(addOns, 'productAddOns');

	const updatedLines = addOns.reduce((lines, addOn) => {
		const newQty = addOn.quantity - 1;
		if (newQty <= 0) {
			return lines.filter((line) => line.id !== addOn.id);
		} else {
			console.log(addOn, 'addOn');
			// const updatedAddOn = createOrUpdateCartItem(addOn, addOn.merchandise.product);
			// return lines.map((item) => (item.id === existingAddOn.id ? updatedAddOn : item));
		}
	}, get(cart).lines);

	// addOns.forEach((addOn) => {
	// 	const newQty = addOn.quantity - 1;
	// });
};
