import { addOnsKeys } from '$lib/constants';
import { addToCart, editCartItem, removeFromCart } from '$lib/shopify';
import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';
import {
	addItem,
	calculateItemCost,
	createOrUpdateCartItem,
	prepareCartLines,
	updateCartTotals
} from './utils';

export type AddOn = {
	id: string;
	title: string;
	checked: boolean;
	value?: FormDataEntryValue | undefined;
};

type Line = {
	id: string;
	merchandiseId: string;
	quantity: number;
	attributes: { key: string; value: FormDataEntryValue }[];
};

export const addItemToCart = async (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[],
	collectionProducts: Product[]
) => {
	// update frontend cart:
	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...selectedAddOns.map((addOn) => {
			return { key: addOn.title, value: addOn.value! };
		})
	];

	const productVariant = selectedVariant || selectedProduct.variants[0];

	/// product section ////

	const existingItem = cart.lines.find(
		(item) =>
			item.merchandise.id === productVariant.id &&
			selectedAddOns.every((addOn) =>
				item.attributes.some((attr) => attr.value === addOn.value && attr.key === addOn.title)
			)
	);

	const updatedItem = createOrUpdateCartItem(
		existingItem,
		productVariant,
		selectedProduct,
		attributes
	);

	const updatedLines = existingItem
		? cart?.lines.map((item) => (item.merchandise.id === productVariant.id ? updatedItem : item))
		: [...cart.lines, updatedItem];
	cart.lines = updatedLines;

	/// end product section ////

	const addOnProduct = collectionProducts.filter((p) => p.productType === 'add-on')[0];

	selectedAddOns.forEach((addOn) => {
		const addOnDetails = addOnProduct.variants.find((item) => item.id === addOn.id);
		const existingItem = cart.lines.find((item) => item.merchandise.id === addOn.id);

		const updatedAddOn = createOrUpdateCartItem(existingItem, addOnDetails!, addOnProduct);

		const updatedAddOnLines = existingItem
			? cart?.lines.map((item) => (item.merchandise.id === addOn.id ? updatedAddOn : item))
			: [...cart.lines, updatedAddOn];

		cart.lines = updatedAddOnLines;
	});

	const { totalQuantity, cost } = updateCartTotals(cart.lines);
	cart.totalQuantity = totalQuantity;
	cart.cost = cost;

	// update backend cart:
	const lines = prepareCartLines(selectedProduct, selectedVariant, selectedAddOns);

	return await addItem(cart, lines);
};

export const deleteItem = async (cart: Cart, cartItem: CartItem) => {
	cart.lines = cart.lines.filter((line) => line.id !== cartItem.id);

	const linesToRemove = [cartItem.id!];

	const linesToEdit: Line[] = [];

	const addOnLines = cart.lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	addOnLines.forEach((addOnLine) => {
		if (addOnLine.quantity - 1 === 0) {
			const updatedLines = cart.lines.filter((line) => line.id !== addOnLine.id);

			cart.lines = updatedLines;

			const { totalQuantity, cost } = updateCartTotals(updatedLines);

			cart.totalQuantity = totalQuantity;

			cart.cost = cost;
			/// remove from backend cart
			linesToRemove.push(addOnLine.id!);
		} else {
			editItemFromCart(cart, addOnLine);
			// update backend cart
			linesToEdit.push({
				id: addOnLine.id!,
				merchandiseId: addOnLine.merchandise.id,
				quantity: addOnLine.quantity - 1,
				attributes: addOnLine.attributes
			});
		}
	});

	await removeFromCart(cart.id, linesToRemove);
	await editCartItem(cart.id, linesToEdit);
	return 'Item removed from cart';
};

export const editItemFromCart = async (cart: Cart, cartItem: CartItem) => {
	const qty = cartItem.quantity - 1;
	const totalAmount = calculateItemCost(
		qty,
		(Number(cartItem.cost.totalAmount.amount) / cartItem.quantity).toString()
	);

	const updatedItem = {
		...cartItem,
		quantity: cartItem.quantity - 1,
		cost: {
			totalAmount: {
				amount: totalAmount,
				currencyCode: cartItem.cost.totalAmount.currencyCode
			}
		}
	};
	const updatedLines = cart.lines.map((item) => (item.id === cartItem.id ? updatedItem : item));
	cart.lines = updatedLines;
	const { totalQuantity, cost } = updateCartTotals(updatedLines);
	cart.totalQuantity = totalQuantity;
	cart.cost = cost;
};

export const editCartTest = async (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[],
	collectionProducts: Product[],
	cartItem: CartItem
) => {
	console.log(cartItem, 'cartItem');
	console.log(cart, 'cart');
	console.log(selectedProduct, 'selectedProduct');
	console.log(selectedVariant, 'selectedVariant');
	console.log(selectedAddOns, 'selectedAddOns');
	console.log(collectionProducts, 'collectionProducts');
};
