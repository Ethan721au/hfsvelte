import { removeFromCart } from '$lib/shopify';
import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';

export type AddOn = {
	id: string;
	title: string;
	checked: boolean;
	value?: FormDataEntryValue | undefined;
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

export const deleteItem = (cart: Cart, cartItem: CartItem) => {
	const linesToRemove = [cartItem.id];

	const addOnLines = cart.lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);
	console.log(addOnLines, 'addOnLine');

	addOnLines.forEach((addOnLine) => {
		if (addOnLine.quantity - 1 === 0) {
			linesToRemove.push(addOnLine.id);
		} else {
			console.log(addOnLine.id, 'remove one');
		}
	});

	// if (addOnLine && addOnLine?.quantity - 1 === 0) {
	// 	linesToRemove.push(addOnLine.id);
	// }

	// if (!addOnLine) {
	// 	// removeFromCart(cart.id, [cartItem.id]);
	// 	// linesToRemove.push(cartItem.id);
	// 	console.log('no addOnLine');
	// } else if (addOnLine && addOnLine?.quantity - 1 === 0) {
	// 	// const updatedCart = cart.lines.filter(
	// 	// 	(line) => line.id !== addOnLine.id && line.id !== cartItem.id
	// 	// );
	// 	// removeFromCart(cart.id, [addOnLine.id, cartItem.id]);
	// 	linesToRemove.push(addOnLine.id);
	// }

	console.log(linesToRemove, 'linesToRemove');

	// removeFromCart(cart.id, linesToRemove);
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

function calculateItemCost(quantity: number, price: string): string {
	return (Number(price) * quantity).toString();
}
