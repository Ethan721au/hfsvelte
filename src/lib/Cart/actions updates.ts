import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';
import type { Writable } from 'svelte/store';
import { addItem, createOrUpdateCartItem, prepareCartLines, updateCartTotals } from './utils';
import { get } from 'svelte/store';

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

export const addProductAndAddOnsToCart = async (
	cart: Writable<Cart>,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[],
	addOns: Product
) => {
	const cartValue = get(cart);

	////////

	const addItemToCart = (
		lines: CartLine[],
		item: Product | AddOn,
		variant: ProductVariant,
		selectedAddOns: AddOn[],
		attributes: Attributes[]
	) => {
		const existingItem = lines.find(
			(line) =>
				line.merchandise.id === variant?.id &&
				(!selectedAddOns ||
					selectedAddOns.every((addOn) =>
						line.attributes.some(
							(lineAttr) => lineAttr.key === addOn.title && lineAttr.value === addOn.value
						)
					))
		);

		const updatedItem = createOrUpdateCartItem(existingItem, variant, item, attributes);

		return existingItem
			? lines.map((line) => (line.merchandise.id === variant?.id ? updatedItem : line))
			: [...lines, updatedItem];
	};

	//////////

	const productAttributes = [
		{ key: 'Order type', value: selectedProduct?.collections.edges[0]?.node.title },
		...selectedAddOns.map((addOn) => ({ key: addOn.title, value: addOn.value! }))
	];
	const productVariant = selectedVariant || selectedProduct?.variants[0];

	let updatedLines = addItemToCart(
		cartValue.lines,
		selectedProduct,
		productVariant,
		selectedAddOns,
		productAttributes
	);

	selectedAddOns.forEach((addOn) => {
		const addOnDetails = addOns.variants.find((variant) => variant.id === addOn.id);
		if (addOnDetails) {
			updatedLines = addItemToCart(updatedLines, addOns, addOnDetails, []);
		}
	});

	const { totalQuantity, cost } = updateCartTotals(updatedLines);

	const updatedCart = { ...cartValue, lines: updatedLines, totalQuantity, cost };

	cart.set(updatedCart);

	const lines = prepareCartLines(selectedProduct!, selectedVariant!, selectedAddOns);

	await addItem(cartValue, lines);
};

export const addProductWithAddOnsToCart = async (
	cart: Writable<Cart>,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[],
	addOns: Product
) => {
	const cartValue = get(cart);
	// Add the main product
	const productCart = addProductToCart(cartValue, selectedProduct, selectedVariant, selectedAddOns);

	// Add all selected add-ons
	const updatedLines = selectedAddOns.reduce((lines, addOn) => {
		const addOnDetails = addOns.variants.find((variant) => variant.id === addOn.id);
		if (!addOnDetails) return lines;

		const existingItem = lines.find((item) => item.merchandise.id === addOn.id);
		const updatedAddOn = createOrUpdateCartItem(existingItem, addOnDetails, addOns);

		return existingItem
			? lines.map((item) => (item.merchandise.id === addOn.id ? updatedAddOn : item))
			: [...lines, updatedAddOn];
	}, productCart.lines);

	// Update totals
	const { totalQuantity, cost } = updateCartTotals(updatedLines);

	// Return the updated cart object
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

// Function for adding a single product to the cart
export const addProductToCart = (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
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
		? cart.lines.map((item) => (item.merchandise.id === productVariant.id ? updatedItem : item))
		: [...cart.lines, updatedItem];

	const { totalQuantity, cost } = updateCartTotals(lines);

	return { ...cart, lines, totalQuantity, cost };
};
