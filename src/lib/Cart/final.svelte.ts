import type {
	AddOnVariant,
	Attributes,
	Cart,
	CartItem,
	Product,
	ProductVariant
} from '$lib/shopify/types';
import { get, type Writable } from 'svelte/store';
import { calculateItemCost, cart, updateCartTotals } from './context.svelte';
import { priceFormatter } from '$lib';
import { addToCart, editCartItem } from '$lib/shopify';

type Line = {
	id: string;
	merchandiseId: string;
	quantity: number;
	attributes: { key: string; value: FormDataEntryValue }[];
};

export function createNewItem(variant: ProductVariant): CartItem {
	const quantity = 1;
	const totalAmount = calculateItemCost(quantity, variant.price.amount);
	const newItem = {
		id: '',
		quantity,
		attributes: variant.attributes,
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
				id: variant.product?.id ?? '',
				handle: variant.product?.handle ?? '',
				title: variant.product?.title ?? '',
				featuredImage: undefined
			}
		}
	};

	const lines = [...get(cart).lines, newItem];

	const { totalQuantity, cost } = updateCartTotals(lines);

	const updatedCart = {
		...get(cart),
		lines,
		totalQuantity,
		cost
	};

	cart.set(updatedCart);

	return newItem;
}

////// NEEED TO UPDATE BELOW TO RETURN ONLY ONE ITEM //////

export const editCartItemQty = (cartItem: CartItem, qty: number) => {
	// const addOns = get(cart).lines.filter((line) =>
	// 	cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	// );

	// const testing = [...addOns, cartItem];
	const testing = [cartItem];

	// console.log('testing', testing);

	const itemsToRemove: string[] = [];

	const itemsToEdit: Line[] = [];

	const lines = testing.reduce((lines, addOn) => {
		const newQty = addOn.quantity + qty;
		if (newQty <= 0) {
			itemsToRemove.push(addOn.id);
			return lines.filter((line) => line.id !== addOn.id);
		} else {
			itemsToEdit.push({
				id: addOn.id!,
				merchandiseId: addOn.merchandise.id,
				quantity: newQty,
				attributes: addOn.attributes
			});

			const updatedAddOn = {
				...addOn,
				quantity: newQty,
				cost: {
					totalAmount: {
						amount: calculateItemCost(
							newQty,
							(Number(addOn.cost.totalAmount.amount) / addOn.quantity).toString()
						),
						currencyCode: addOn.cost.totalAmount.currencyCode
					}
				}
			};

			return lines.map((item) => (item.id === addOn.id ? updatedAddOn : item));
		}
	}, get(cart).lines);

	const { totalQuantity, cost } = updateCartTotals(lines);

	const updatedCart = {
		...get(cart),
		lines,
		totalQuantity,
		cost
	};

	cart.set(updatedCart);

	return { itemsToRemove, itemsToEdit };
};

export const testaddItemToCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOnVariant[]
) => {
	const newItems = [];
	const editItems = [];

	const updatedAddOns = selectedAddOns.map((addOn) => {
		return {
			...addOn,
			attributes: []
		};
	});

	const attributes = [
		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
		...updatedAddOns.map((addOn) => ({
			key: addOn.title,
			value: `${addOn.value} (+${priceFormatter(addOn.price.amount, 0)})`
		}))
	];

	const productVariant = selectedVariant
		? { ...selectedVariant, product: selectedProduct }
		: { ...selectedProduct.variants[0], product: selectedProduct };

	const cartItemsToCreate = [...updatedAddOns, { ...productVariant, attributes }];

	cartItemsToCreate.forEach((product) => {
		const existingItem = get(cart).lines.find((item) => {
			if (item.merchandise.id !== product.id) return false;

			return (
				product.attributes.every((addOn) =>
					item.attributes.some((attr) => addOn.key === attr.key && addOn.value === attr.value)
				) &&
				item.attributes.every((attr) =>
					product.attributes.some((addOn) => addOn.key === attr.key && addOn.value === attr.value)
				)
			);
		});

		if (existingItem) {
			console.log('existingItem', existingItem);
			const { itemsToEdit } = editCartItemQty(existingItem, 1);
			itemsToEdit.forEach((item) => editItems.push(item));
		} else {
			const newItem = createNewItem(product);
			newItems.push({
				merchandiseId: newItem.merchandise.id,
				quantity: newItem.quantity,
				attributes: newItem.attributes
			});
		}
	});

	console.log('cart', get(cart));

	let updatedCart = get(cart);

	updatedCart = (await addItemToShopifyCart(cart, newItems)) as Cart;
	updatedCart = (await editCartItemInShopifyCart(cart, editItems)) as Cart;

	cart.set(updatedCart as Cart);
};

export const removeItemFromCartTest = async (cartItem: CartItem, qty: number) => {
	console.log('cartItem', cartItem);
	console.log('qty', qty);
	const addOns = get(cart).lines.filter((line) =>
		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
	);

	// const { itemsToRemove, itemsToEdit } = editCartItemQty(cartItem, -qty);

	// console.log('itemsToRemove', itemsToRemove);
	// console.log('itemsToEdit', itemsToEdit);
	// console.log('cart', get(cart));

	// let updatedCart = get(cart);

	// updatedCart = (await removeItemFromShopifyCart(cart, itemsToRemove)) as Cart;
	// updatedCart = (await editCartItemInShopifyCart(cart, itemsToEdit)) as Cart;
	// cart.set(updatedCart as Cart);
};

export async function addItemToShopifyCart(
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

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error adding item to cart';
	}
}

export async function editCartItemInShopifyCart(
	cart: Writable<Cart>,
	lines: { id: string; merchandiseId: string; quantity: number; attributes: Attributes[] }[]
): Promise<Cart | string> {
	if (!get(cart).id || !lines) {
		return 'Error editing item in cart';
	}

	try {
		let updatedCart = await editCartItem(get(cart).id, lines);

		const { totalQuantity } = updateCartTotals(updatedCart.lines);

		updatedCart = { ...updatedCart, totalQuantity };

		return updatedCart;
	} catch (error) {
		console.log(error);
		return 'Error editing item in cart';
	}
}
