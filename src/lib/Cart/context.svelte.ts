// import { addToCart, createCart, editCartItem, getCart, removeFromCart } from '$lib/shopify';
// import type { Cookies } from '@sveltejs/kit';
// import { get, writable, type Writable } from 'svelte/store';
// import type {
// 	AddOnVariant,
// 	Attributes,
// 	Cart,
// 	CartItem,
// 	Product,
// 	ProductVariant
// } from '$lib/shopify/types';
// import { addOnsKeys } from '$lib/constants';
// import { priceFormatter } from '$lib';

// type Line = {
// 	id: string;
// 	merchandiseId: string;
// 	quantity: number;
// 	attributes: { key: string; value: FormDataEntryValue }[];
// };

// export type UpdateType = 'plus' | 'minus' | 'delete' | 'edit' | 'add';

// const emptyCart: Cart = {
// 	id: '',
// 	checkoutUrl: '',
// 	totalQuantity: 0,
// 	lines: [],
// 	cost: {
// 		subtotalAmount: { amount: '0', currencyCode: 'USD' },
// 		totalAmount: { amount: '0', currencyCode: 'USD' },
// 		totalTaxAmount: { amount: '0', currencyCode: 'USD' }
// 	}
// };

// export const cart: Writable<Cart> = writable(emptyCart);
// export const isCartEdit = writable(false);
// export const isCartUpdate = writable(false);

// // export const fetchOrCreateCart = async (cookies: Cookies) => {
// // 	const cartId = cookies.get('cartId');

// // 	if (cartId) {
// // 		let cart = await getCart(cartId);

// // 		if (cart) {
// // 			const { totalQuantity } = updateCartTotals(cart.lines);
// // 			cart = { ...cart, totalQuantity };
// // 			return cart;
// // 		}
// // 	} else {
// // 		const cart = await createCartAndSetCookie(cookies);
// // 		if (cart) {
// // 			return cart;
// // 		}
// // 	}
// // };

// export async function createCartAndSetCookie(cookies: Cookies) {
// 	const cart = await createCart();
// 	cookies.set('cartId', cart.id, {
// 		path: '/',
// 		httpOnly: true,
// 		sameSite: 'strict',
// 		maxAge: 600 * 60
// 	});
// 	return cart;
// }

// export function calculateItemCost(quantity: number, price: string): string {
// 	return (Number(price) * quantity).toString();
// }

// export function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
// 	const products = lines.filter((line) => !addOnsKeys.includes(line.merchandise.title));

// 	const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

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

// export function createOrUpdateCartItem(
// 	existingItem: CartItem | undefined,
// 	variant: ProductVariant,
// 	product?: Product,
// 	attributes?: Attributes[]
// ): CartItem {
// 	const quantity = existingItem ? existingItem.quantity + 1 : 1;
// 	const totalAmount = calculateItemCost(quantity, variant.price.amount);

// 	return {
// 		id: existingItem?.id ?? '',
// 		quantity,
// 		attributes: attributes || [],
// 		cost: {
// 			totalAmount: {
// 				amount: totalAmount,
// 				currencyCode: variant.price.currencyCode
// 			}
// 		},
// 		merchandise: {
// 			id: variant.id,
// 			title: variant.title,
// 			selectedOptions: variant.selectedOptions,
// 			product: {
// 				id: product?.id ?? '',
// 				handle: product?.handle ?? '',
// 				title: product?.title ?? '',
// 				featuredImage: product?.featuredImage ?? undefined
// 			}
// 		}
// 	};
// }

// const updateAddOns = (selectedAddOns: AddOnVariant[]) => {
// 	const addOns = selectedAddOns.map((addOn) => {
// 		const existingAddOn = get(cart).lines.find((item) => item.merchandise.id === addOn.id);

// 		const updatedAddOn = createOrUpdateCartItem(existingAddOn, addOn);

// 		return {
// 			...updatedAddOn,
// 			key: addOn.title,
// 			value: `${addOn.value} (+${priceFormatter(addOn.price.amount, 0)})`
// 		};
// 	});

// 	const updatedLines = addOns.reduce((lines, addOn) => {
// 		const existingItem = lines.find((item) => item.merchandise.id === addOn.id);

// 		return existingItem
// 			? lines.map((item) => (item.id === existingItem.id ? addOn : item))
// 			: [...lines, addOn];
// 	}, get(cart).lines);

// 	return { addOns, updatedLines };
// };

// const addItemToFrontendCart = (
// 	selectedProduct: Product,
// 	selectedVariant: ProductVariant | undefined,
// 	selectedAddOns: AddOnVariant[]
// ) => {
// 	const { addOns, updatedLines } = updateAddOns(selectedAddOns);

// 	const attributes = [
// 		{ key: 'Order type', value: selectedProduct.collections.edges[0].node.title },
// 		...addOns.map((addOn) => {
// 			return {
// 				key: addOn.key,
// 				value: addOn.value
// 			};
// 		})
// 	];

// 	const productVariant = selectedVariant || selectedProduct.variants[0];

// 	const existingItem = updatedLines.find(
// 		(item) =>
// 			item.merchandise.id === productVariant.id &&
// 			selectedAddOns.every((addOn) =>
// 				item.attributes.some((attr) => {
// 					if (typeof attr.value === 'string') {
// 						const match = attr.value.match(/^(.+?) \(\+\$/);
// 						return attr.key === addOn.title && match && match[1] === addOn.value;
// 					}
// 					return false;
// 				})
// 			)
// 	);

// 	const updatedItem = createOrUpdateCartItem(
// 		existingItem,
// 		productVariant,
// 		selectedProduct,
// 		attributes
// 	);

// 	const lines = existingItem
// 		? updatedLines.map((item) => (item.id === existingItem.id ? updatedItem : item))
// 		: [...updatedLines, updatedItem];

// 	const { totalQuantity, cost } = updateCartTotals(lines);

// 	const updatedCart = {
// 		...get(cart),
// 		lines,
// 		totalQuantity,
// 		cost
// 	};

// 	cart.set(updatedCart);

// 	return { updatedItem, addOns };
// };

// /////// add item to cart:

// export const addItemtoCart = async (
// 	selectedProduct: Product,
// 	selectedVariant: ProductVariant | undefined,
// 	selectedAddOns: AddOnVariant[]
// ) => {
// 	const { updatedItem, addOns } = addItemToFrontendCart(
// 		selectedProduct,
// 		selectedVariant,
// 		selectedAddOns
// 	);

// 	const updatedCart = await addItemToShopifyCart(cart, [
// 		{
// 			merchandiseId: updatedItem.merchandise.id,
// 			quantity: 1,
// 			attributes: updatedItem.attributes
// 		},
// 		...addOns.map((addOn) => {
// 			return {
// 				merchandiseId: addOn.merchandise.id,
// 				quantity: 1,
// 				attributes: []
// 			};
// 		})
// 	]);

// 	cart.set(updatedCart as Cart);
// };

// export async function addItemToShopifyCart(
// 	cart: Writable<Cart>,
// 	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
// ): Promise<Cart | string> {
// 	if (!get(cart).id || !lines) {
// 		return 'Error adding item to cart';
// 	}

// 	try {
// 		let updatedCart = await addToCart(get(cart).id, lines);

// 		const { totalQuantity } = updateCartTotals(updatedCart.lines);

// 		updatedCart = { ...updatedCart, totalQuantity };

// 		return updatedCart;
// 	} catch (error) {
// 		console.log(error);
// 		return 'Error adding item to cart';
// 	}
// }

// //////// remove item from cart:

// export const editCartItemQty = (cartItem: CartItem, qty: number) => {
// 	const addOns = get(cart).lines.filter((line) =>
// 		cartItem.attributes.some((attr) => attr.key === line.merchandise.title)
// 	);

// 	const testing = [...addOns, cartItem];

// 	const itemsToRemove: string[] = [];

// 	const itemsToEdit: Line[] = [];

// 	const lines = testing.reduce((lines, addOn) => {
// 		const newQty = addOn.quantity - qty;
// 		if (newQty <= 0) {
// 			itemsToRemove.push(addOn.id);
// 			return lines.filter((line) => line.id !== addOn.id);
// 		} else {
// 			itemsToEdit.push({
// 				id: addOn.id!,
// 				merchandiseId: addOn.merchandise.id,
// 				quantity: newQty,
// 				attributes: addOn.attributes
// 			});

// 			const updatedAddOn = {
// 				...addOn,
// 				quantity: newQty,
// 				cost: {
// 					totalAmount: {
// 						amount: calculateItemCost(
// 							newQty,
// 							(Number(addOn.cost.totalAmount.amount) / addOn.quantity).toString()
// 						),
// 						currencyCode: addOn.cost.totalAmount.currencyCode
// 					}
// 				}
// 			};

// 			return lines.map((item) => (item.id === addOn.id ? updatedAddOn : item));
// 		}
// 	}, get(cart).lines);

// 	const { totalQuantity, cost } = updateCartTotals(lines);

// 	const updatedCart = {
// 		...get(cart),
// 		lines,
// 		totalQuantity,
// 		cost
// 	};

// 	cart.set(updatedCart);

// 	return { itemsToRemove, itemsToEdit };
// };

// export const removeItemFromCart = async (cartItem: CartItem, qty: number) => {
// 	const { itemsToRemove, itemsToEdit } = editCartItemQty(cartItem, qty);

// 	let updatedCart = get(cart);

// 	updatedCart = (await removeItemFromShopifyCart(cart, itemsToRemove)) as Cart;
// 	updatedCart = (await editCartItemInShopifyCart(cart, itemsToEdit)) as Cart;
// 	cart.set(updatedCart as Cart);
// };

// export async function removeItemFromShopifyCart(
// 	cart: Writable<Cart>,
// 	lineIds: string[]
// ): Promise<Cart | string> {
// 	if (!get(cart).id || !lineIds) {
// 		return 'Error removing item from cart';
// 	}

// 	try {
// 		let updatedCart = await removeFromCart(get(cart).id, lineIds);

// 		const { totalQuantity } = updateCartTotals(updatedCart.lines);

// 		updatedCart = { ...updatedCart, totalQuantity };

// 		return updatedCart;
// 	} catch (error) {
// 		console.log(error);
// 		return 'Error removing item from cart';
// 	}
// }

// export async function editCartItemInShopifyCart(
// 	cart: Writable<Cart>,
// 	lines: { id: string; merchandiseId: string; quantity: number; attributes: Attributes[] }[]
// ): Promise<Cart | string> {
// 	if (!get(cart).id || !lines) {
// 		return 'Error editing item in cart';
// 	}

// 	try {
// 		let updatedCart = await editCartItem(get(cart).id, lines);

// 		const { totalQuantity } = updateCartTotals(updatedCart.lines);

// 		updatedCart = { ...updatedCart, totalQuantity };

// 		return updatedCart;
// 	} catch (error) {
// 		console.log(error);
// 		return 'Error editing item in cart';
// 	}
// }

// //////// edit item in cart:

// export const editItemInCart = async (
// 	selectedProduct: Product,
// 	selectedVariant: ProductVariant | undefined,
// 	selectedAddOns: AddOnVariant[],
// 	cartItem: CartItem
// ) => {
// 	const { itemsToRemove, itemsToEdit } = editCartItemQty(cartItem, cartItem.quantity);

// 	const { updatedItem, addOns } = addItemToFrontendCart(
// 		selectedProduct,
// 		selectedVariant,
// 		selectedAddOns
// 	);

// 	let updatedCart = get(cart);

// 	updatedCart = (await removeItemFromShopifyCart(cart, itemsToRemove)) as Cart;
// 	updatedCart = (await editCartItemInShopifyCart(cart, itemsToEdit)) as Cart;
// 	updatedCart = (await addItemToShopifyCart(cart, [
// 		{
// 			merchandiseId: updatedItem.merchandise.id,
// 			quantity: 1,
// 			attributes: updatedItem.attributes
// 		},
// 		...addOns.map((addOn) => {
// 			return {
// 				merchandiseId: addOn.merchandise.id,
// 				quantity: 1,
// 				attributes: []
// 			};
// 		})
// 	])) as Cart;

// 	cart.set(updatedCart);
// };
