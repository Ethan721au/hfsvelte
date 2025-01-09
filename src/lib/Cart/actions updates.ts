import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';
import type { Writable } from 'svelte/store';
import { addItem, createOrUpdateCartItem, prepareCartLines, updateCartTotals } from './utils';
import { get } from 'svelte/store';
import { editCartItem, removeFromCart } from '$lib/shopify';

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
	value?: FormDataEntryValue | undefined;
};

export const prepareDeleteLines = (cart: Cart, cartItem: CartItem | undefined) => {
	const linesIdsToRemove = cartItem ? [cartItem.id] : [];

	const linesToEdit: Line[] = [];

	const addOnLines = cart.lines.filter((line) =>
		cartItem?.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	addOnLines.forEach((addOnLine) => {
		if (addOnLine.quantity - 1 === 0) {
			/// remove from backend cart
			linesIdsToRemove.push(addOnLine.id!);
		} else {
			// update backend cart
			linesToEdit.push({
				id: addOnLine.id!,
				merchandiseId: addOnLine.merchandise.id,
				quantity: addOnLine.quantity - 1,
				attributes: addOnLine.attributes
			});
		}
	});

	return { linesIdsToRemove, linesToEdit };
};

export const addProductWithAddOnsToCart = async (
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

	const lines = prepareCartLines(selectedProduct!, selectedVariant!, selectedAddOns);

	await addItem(cartValue, lines);
};

export const addProductToCart = (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOn[]
) => {
	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...selectedAddOns.map((addOn) => ({ key: addOn.title, value: addOn.value! }))
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

export const deleteItemFromCart = async (cart: Writable<Cart>, cartItem: CartItem | undefined) => {
	if (!cartItem) return;
	const cartValue = get(cart);

	const linesIdsToRemove = [cartItem.id];

	const linesToEdit: Line[] = [];

	const cartWithDeletedItem = cartValue.lines.filter((line) => line.id !== cartItem.id);

	console.log(cartWithDeletedItem, 'cartWithDeletedItem');

	const productAddOnsCartLines = cartValue.lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	console.log(productAddOnsCartLines, 'productAddOnsCartLines');

	productAddOnsCartLines.forEach((addOnLine) => {
		const newQty = addOnLine.quantity - 1;
		if (newQty <= 0) {
			/// remove from backend cart
			linesIdsToRemove.push(addOnLine.id);
		} else {
			// update backend cart
			linesToEdit.push({
				id: addOnLine.id,
				merchandiseId: addOnLine.merchandise.id,
				quantity: addOnLine.quantity - 1,
				attributes: addOnLine.attributes
			});
		}
	});

	await removeFromCart(cartValue.id, linesIdsToRemove);
	await editCartItem(cartValue.id, linesToEdit);
};
