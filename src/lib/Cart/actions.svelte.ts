import { getContext } from 'svelte';
import type { CartContext } from '../../routes/+layout.svelte';

export const testing = () => {
	const { cart } = getContext<CartContext>('cart');
	console.log(cart, 'sdfsfsdfsdf');
};
