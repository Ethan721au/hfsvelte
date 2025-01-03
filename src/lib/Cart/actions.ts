import { addOnsKeys } from '$lib/constants';
import { addToCart, createCart, editCartItem, getCollectionProducts } from '$lib/shopify';
import type {
	Attributes,
	Cart,
	CartItem,
	Collection,
	Product,
	ProductVariant
} from '$lib/shopify/types';
import type { Cookies } from '@sveltejs/kit';

type Line = {
	merchandiseId: string;
	quantity: number;
	attributes: { key: string; value: FormDataEntryValue }[];
};

export type UpdateType = 'plus' | 'minus' | 'delete' | 'edit' | 'add';

type CartAction =
	| {
			type: 'UPDATE_ITEM';
			payload: { merchandiseId: string; updateType: UpdateType };
	  }
	| {
			type: 'ADD_ITEM';
			payload: {
				variant: ProductVariant;
				product: Product;
				attributes: Attributes[];
			};
	  }
	| {
			type: 'EDIT_ITEM';
			payload: {
				variant: ProductVariant;
				product: Product;
				attributes: Attributes[];
			};
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

export const prepareCartItems = async (
	formData: FormData,
	collection: Collection,
	cart: Cart,
	updateType: UpdateType,
	cartItem?: CartItem
) => {
	const items = Object.fromEntries(formData.entries());
	console.log('items', items);
	const products = await getCollectionProducts({
		collection: items.collection as string
	});
	const product = products.find((p) => p.title === items[collection!.title]);
	const variant = product?.variants.find((v) => v.title === items.variant) || product?.variants[0];
	const productAddOns = Object.entries(items)
		.filter(([key]) => addOnsKeys.includes(key))
		.map(([key, value]) => ({ key, value }));

	const addOnsIds = productAddOns.map(({ key }) => {
		const merchandiseId = products
			.find((p) => p.handle === 'add-ons')
			?.variants.find((v) => v.title === key)?.id as string;

		if (!merchandiseId) {
			throw new Error(`Merchandise ID not found for add-on: ${key}`);
		}
		return {
			merchandiseId,
			quantity: 1,
			attributes: []
		};
	});

	const variantId = {
		merchandiseId: variant?.id || '',
		quantity: 1,
		attributes: [{ key: 'Order type', value: collection?.title }, ...productAddOns]
	};

	const lines = [variantId, ...addOnsIds];
	console.log(lines, 'lines');
	console.log(products, 'products');
	console.log(cart, 'cart');
	console.log(updateType, 'updateType');
	console.log(cartItem, 'cartItem');

	// pepareCart(lines, products, cart, updateType);

	// addItem(cart, lines);

	return {
		lines,
		products
	};
};

const pepareCart = (lines: Line[], products: Product[], cart: Cart, updateType: UpdateType) => {
	lines.map((line) => {
		const product = products.find((p) => p.variants.some((v) => v.id === line.merchandiseId));
		const variant = product?.variants.find((v) => v.id === line.merchandiseId);
		const attributes = line.attributes.map((attr) => ({
			key: attr.key,
			value: attr.value
		}));

		if (variant && product) {
			updateCart(cart, {
				type: 'ADD_ITEM',
				payload: { variant, product, attributes }
			});
		} else {
			console.error('Skipping item due to missing product or variant:', line);
		}
	});
};

export const updateCart = (cart: Cart, action: CartAction) => {
	switch (action.type) {
		case 'ADD_ITEM': {
			const { variant, product, attributes } = action.payload;
			const existingItem = cart?.lines.find((item) => item.merchandise.id === variant.id);
			const updatedItem = createOrUpdateCartItem(existingItem, variant, product, attributes);

			const updatedLines = existingItem
				? cart?.lines.map((item) => (item.merchandise.id === variant.id ? updatedItem : item))
				: [...cart.lines, updatedItem];

			cart.lines = updatedLines;

			const { totalQuantity, cost } = updateCartTotals(updatedLines);
			cart.totalQuantity = totalQuantity;
			cart.cost = cost;

			return;
		}
		case 'EDIT_ITEM': {
			const { variant, product, attributes } = action.payload;
			const existingItem = cart?.lines.find((item) => item.merchandise.id === variant.id);
			const updatedItem = createOrUpdateCartItem(existingItem, variant, product, attributes);

			const updatedLines = existingItem
				? cart?.lines.map((item) => (item.merchandise.id === variant.id ? updatedItem : item))
				: [...cart.lines, updatedItem];

			cart.lines = updatedLines;

			const { totalQuantity, cost } = updateCartTotals(updatedLines);
			cart.totalQuantity = totalQuantity;
			cart.cost = cost;

			return;
		}
		default:
			return;
	}

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

	// function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
	// 	const products = lines.filter((line) => !addOnsKeys.includes(line.merchandise.title));

	// 	const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

	// 	// const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
	// 	const totalAmount = lines.reduce((sum, item) => sum + Number(item.cost.totalAmount.amount), 0);

	// 	const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? 'USD';

	// 	return {
	// 		totalQuantity,
	// 		cost: {
	// 			subtotalAmount: { amount: totalAmount.toString(), currencyCode },
	// 			totalAmount: { amount: totalAmount.toString(), currencyCode },
	// 			totalTaxAmount: { amount: '0', currencyCode }
	// 		}
	// 	};
	// }

	function calculateItemCost(quantity: number, price: string): string {
		return (Number(price) * quantity).toString();
	}
};

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

// export async function updateItemQuantity(
// 	prevState: any,
// 	payload: {
// 		merchandiseId: string;
// 		quantity: number;
// 	}
// ) {
// 	let cartId = cookies().get('cartId')?.value;
// 	if (!cartId) {
// 		return 'Missing cart ID';
// 	}

// 	const { merchandiseId, quantity } = payload;

// 	try {
// 		const cart = await getCart(cartId);
// 		if (!cart) {
// 			return 'Error fetching cart';
// 		}

// 		const lineItem = cart.lines.find((line) => line.merchandise.id === merchandiseId);

// 		if (lineItem && lineItem.id) {
// 			if (quantity === 0) {
// 				await removeFromCart(cartId, [lineItem.id]);
// 			} else {
// 				await editCartItem(cartId, [
// 					{
// 						id: lineItem.id,
// 						merchandiseId,
// 						quantity
// 					}
// 				]);
// 			}
// 		} else if (quantity > 0) {
// 			// If the item doesn't exist in the cart and quantity > 0, add it
// 			await addToCart(cartId, [{ merchandiseId, quantity }]);
// 		}

// 		// revalidateTag(TAGS.cart);
// 	} catch (error) {
// 		console.error(error);
// 		return 'Error updating item quantity';
// 	}
// }

// export async function AddAttribute(prevState: unknown, attributes: Attributes[]) {
// 	const cookieStore = await cookies();
// 	const cartId = cookieStore.get('cartId')?.value;

// 	if (!cartId || !attributes) {
// 		return 'Error adding item to cart';
// 	}

// 	try {
// 		await updateCartAttributes(cartId, attributes);
// 		// revalidateTag(TAGS.cart);
// 		return 'Attribute added to cart';
// 	} catch (error) {
// 		console.log(error);
// 		return 'Error adding attribute to cart';
// 	}
// }

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
