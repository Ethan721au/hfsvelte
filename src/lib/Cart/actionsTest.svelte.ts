// import { addOnsKeys } from '$lib/constants';
// import { getCart } from '$lib/shopify';
// import type { Cart, CartItem } from '$lib/shopify/types';
// import { writable } from 'svelte/store';

// export const fetchCart = async (cartId: string) => {
// 	let cart = await getCart(cartId);

// 	if (!cart) return;

// 	const { totalQuantity } = updateCartTotals(cart.lines);
// 	cart = { ...cart, totalQuantity };
// 	console.log(cart);
// };

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
