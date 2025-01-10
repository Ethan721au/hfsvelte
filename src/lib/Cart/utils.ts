import { addOnsKeys } from '$lib/constants';
import { addToCart } from '$lib/shopify';
import type { Attributes, Cart, CartItem, Product, ProductVariant } from '$lib/shopify/types';
import type { AddOn } from './actions';

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

export function createOrUpdateCartItem(
	existingItem: CartItem | undefined,
	variant: ProductVariant,
	product: Product,
	attributes?: Attributes[]
): CartItem {
	const quantity = existingItem ? existingItem.quantity + 1 : 1;
	const totalAmount = calculateItemCost(quantity, variant.price.amount);

	return {
		id: existingItem?.id,
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
				id: product.id,
				handle: product.handle,
				title: product.title,
				featuredImage: product.featuredImage
			}
		}
	};
}
