import { addOnsKeys } from '$lib/constants';
import { addToCart, editCartItem, removeFromCart } from '$lib/shopify';
import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';

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

export const prepareCartLines = (
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[]
) => {
	const addOns = selectedAddOns.map((addOn) => {
		return { merchandiseId: addOn.id, quantity: 1, attributes: [] };
	});

	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...selectedAddOns.map((addOn) => {
			return { key: addOn.title, value: addOn.value };
		})
	];

	const product = {
		merchandiseId: selectedVariant?.id || selectedProduct.variants[0].id,
		quantity: 1,
		attributes
	};

	return [product, ...addOns];
};

export async function addItem(
	cart: Cart,
	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
) {
	if (!cart || !lines) {
		return 'Error adding item to cart';
	}

	try {
		await addToCart(cart.id, lines);
		return 'Item added to cart';
	} catch (error) {
		console.log(error);
		return 'Error adding item to cart';
	}
}

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
			linesToRemove.push(addOnLine.id!);
		} else {
			linesToEdit.push({
				id: addOnLine.id!,
				merchandiseId: addOnLine.merchandise.id,
				quantity: addOnLine.quantity - 1,
				attributes: addOnLine.attributes
			});
		}
	});

	// await removeFromCart(cart.id, linesToRemove);
	// await editCartItem(cart.id, linesToEdit);
	return 'Item removed from cart';
};

function calculateItemCost(quantity: number, price: string): string {
	return (Number(price) * quantity).toString();
}

export const addItemToCart = async (
	cart: Cart,
	selectedProduct: Product,
	selectedVariant: ProductVariant,
	selectedAddOns: AddOn[]
) => {
	// update frontend cart:
	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...selectedAddOns.map((addOn) => {
			return { key: addOn.title, value: addOn.value! };
		})
	];
	const existingItem = cart?.lines.find((item) => item.merchandise.id === selectedVariant.id);
	const updatedItem = createOrUpdateCartItem(
		existingItem,
		selectedVariant,
		selectedProduct,
		attributes
	);
	const updatedLines = existingItem
		? cart?.lines.map((item) => (item.merchandise.id === selectedVariant.id ? updatedItem : item))
		: [...cart.lines, updatedItem];

	cart.lines = updatedLines;

	const { totalQuantity, cost } = updateCartTotals(updatedLines);
	cart.totalQuantity = totalQuantity;
	cart.cost = cost;

	// update backend cart:
	const lines = prepareCartLines(selectedProduct, selectedVariant, selectedAddOns);

	return await addItem(cart, lines);
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
		attributes,
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

export function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
	const products = lines.filter((line) => !addOnsKeys.includes(line.merchandise.title));

	const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

	// const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
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
