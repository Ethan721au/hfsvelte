import type { Cart, CartItem } from '$lib/shopify/types';
import { updateCartTotals } from './utils';

type Line = {
	id: string;
	merchandiseId: string;
	quantity: number;
	attributes: { key: string; value: FormDataEntryValue }[];
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
