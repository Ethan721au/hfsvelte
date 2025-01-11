import type { Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';
import type { Writable } from 'svelte/store';
import { addItem, createOrUpdateCartItem, prepareCartLines } from './utils';
import { get } from 'svelte/store';
import { createCart, editCartItem, removeFromCart } from '$lib/shopify';
import type { Cookies } from '@sveltejs/kit';
import { addOnsKeys } from '$lib/constants';

type Line = {
	id: string;
	merchandiseId: string;
	quantity: number;
	attributes: { key: string; value: FormDataEntryValue }[];
};

export type AddOn = {
	id: string;
	title: string;
	checked: boolean;
	value: FormDataEntryValue;
};

export type UpdateType = 'plus' | 'minus' | 'delete' | 'edit' | 'add';

export const addProductWithAddOnsToCart = (
	cart: Writable<Cart>,
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[],
	addOns: Product
) => {
	const cartValue = get(cart);

	const productCart = addProductToCart(cartValue, selectedProduct, selectedVariant, selectedAddOns);

	const updatedLines = selectedAddOns.reduce((lines, addOn) => {
		const addOnDetails = addOns.variants.find((variant) => variant.id === addOn.id);
		if (!addOnDetails) return lines;

		const existingItem = lines.find((item) => item.merchandise.id === addOn.id);
		const updatedAddOn = createOrUpdateCartItem(existingItem, addOnDetails, addOns);

		return existingItem
			? lines.map((item) => (item.id === existingItem.id ? updatedAddOn : item))
			: [...lines, updatedAddOn];
	}, productCart.lines);

	const { totalQuantity, cost } = updateCartTotals(updatedLines);

	const updatedCart = {
		...cartValue,
		lines: updatedLines,
		totalQuantity,
		cost
	};

	cart.set(updatedCart);

	const newLines = prepareCartLines(selectedProduct!, selectedVariant!, selectedAddOns);

	return newLines;
};

export const addProductToCart = (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[]
) => {
	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...selectedAddOns.map((addOn) => ({ key: addOn.title, value: addOn.value }))
	];

	const productVariant = selectedVariant || selectedProduct.variants[0];

	const existingItem = cart.lines.find(
		(item) =>
			item.merchandise.id === productVariant.id &&
			selectedAddOns.every((addOn) =>
				item.attributes.some((attr) => attr.key === addOn.title && attr.value === addOn.value)
			)
	);

	const updatedItem = createOrUpdateCartItem(
		existingItem,
		productVariant,
		selectedProduct,
		attributes
	);

	const lines = existingItem
		? cart.lines.map((item) => (item.id === existingItem.id ? updatedItem : item))
		: [...cart.lines, updatedItem];

	const { totalQuantity, cost } = updateCartTotals(lines);

	return { ...cart, lines, totalQuantity, cost };
};

export const deleteItemFromCart = (cart: Writable<Cart>, cartItem: CartItem) => {
	const cartValue = get(cart);

	const linesIdsToRemove = [cartItem.id];

	const linesToEdit: Line[] = [];

	let updatedLines = cartValue.lines.filter((line) => line.id !== cartItem.id);

	const isProductRemaining = updatedLines.some(
		(line) => line.merchandise.product.productType === 'product'
	);

	const productAddOnsCartLines = cartValue.lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	productAddOnsCartLines.forEach((addOnLine) => {
		const newQty = addOnLine.quantity - 1;

		if (newQty <= 0 || !isProductRemaining) {
			updatedLines = updatedLines.filter((line) => line.id !== addOnLine.id);

			linesIdsToRemove.push(addOnLine.id);
		} else {
			linesToEdit.push({
				id: addOnLine.id!,
				merchandiseId: addOnLine.merchandise.id,
				quantity: newQty,
				attributes: addOnLine.attributes
			});

			const updatedItem = {
				...addOnLine,
				quantity: newQty,
				cost: {
					totalAmount: {
						amount: calculateItemCost(
							newQty,
							(Number(addOnLine.cost.totalAmount.amount) / addOnLine.quantity).toString()
						),
						currencyCode: addOnLine.cost.totalAmount.currencyCode
					}
				}
			};

			updatedLines = updatedLines.map((item) => (item.id === addOnLine.id ? updatedItem : item));
		}
	});

	const { totalQuantity, cost } = updateCartTotals(updatedLines);

	cart.set({ ...cartValue, lines: updatedLines, totalQuantity, cost });

	return { linesIdsToRemove, linesToEdit };
};

export const pleaseAddItemToCart = async (
	cart: Writable<Cart>,
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[],
	addOns: Product
) => {
	const cartValue = get(cart);

	const newLines = addProductWithAddOnsToCart(
		cart,
		selectedProduct,
		selectedVariant,
		selectedAddOns,
		addOns
	);

	await addItem(cartValue, newLines);
};

export const pleaseRemovefromCart = async (cart: Writable<Cart>, cartItem: CartItem) => {
	const cartValue = get(cart);

	const { linesIdsToRemove, linesToEdit } = deleteItemFromCart(cart, cartItem);

	await Promise.all([
		removeFromCart(cartValue.id, linesIdsToRemove),
		editCartItem(cartValue.id, linesToEdit)
	]);

	// await removeFromCart(cartValue.id, linesIdsToRemove);
	// await editCartItem(cartValue.id, linesToEdit);
};

export const pleaseEditCartItem = async (
	cart: Writable<Cart>,
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[],
	addOns: Product,
	cartItem: CartItem
) => {
	const cartValue = get(cart);

	const { linesIdsToRemove, linesToEdit } = deleteItemFromCart(cart, cartItem);

	const newLines = addProductWithAddOnsToCart(
		cart,
		selectedProduct,
		selectedVariant,
		selectedAddOns,
		addOns
	);

	await removeFromCart(cartValue.id, linesIdsToRemove);
	await editCartItem(cartValue.id, linesToEdit);
	await addItem(cartValue, newLines);

	// return 'completed';
};

export const incrementCartItem = async (cart: Writable<Cart>, cartItem: CartItem, qty: number) => {
	const cartValue = get(cart);

	const linesToEdit: Line[] = [];

	linesToEdit.push({
		id: cartItem.id!,
		merchandiseId: cartItem.merchandise.id,
		quantity: cartItem.quantity + qty,
		attributes: cartItem.attributes
	});

	const updatedItem = {
		...cartItem,
		quantity: cartItem.quantity + qty,
		cost: {
			totalAmount: {
				amount: calculateItemCost(
					cartItem.quantity + qty,
					(Number(cartItem.cost.totalAmount.amount) / cartItem.quantity).toString()
				),
				currencyCode: cartItem.cost.totalAmount.currencyCode
			}
		}
	};
	let updatedLines = cartValue.lines.map((item) => (item.id === cartItem.id ? updatedItem : item));

	const productAddOnsCartLines = updatedLines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	productAddOnsCartLines.forEach((addOnLine) => {
		const newQty = addOnLine.quantity + qty;

		linesToEdit.push({
			id: addOnLine.id!,
			merchandiseId: addOnLine.merchandise.id,
			quantity: newQty,
			attributes: addOnLine.attributes
		});

		const updatedItem = {
			...addOnLine,
			quantity: newQty,
			cost: {
				totalAmount: {
					amount: calculateItemCost(
						newQty,
						(Number(addOnLine.cost.totalAmount.amount) / addOnLine.quantity).toString()
					),
					currencyCode: addOnLine.cost.totalAmount.currencyCode
				}
			}
		};

		updatedLines = updatedLines.map((item) => (item.id === addOnLine.id ? updatedItem : item));
	});

	const { totalQuantity, cost } = updateCartTotals(updatedLines);

	cart.set({ ...cartValue, lines: updatedLines, totalQuantity, cost });

	await editCartItem(cartValue.id, linesToEdit);
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
