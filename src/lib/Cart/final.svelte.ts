import type { AddOnVariant, Product, ProductVariant } from '$lib/shopify/types';
import { get } from 'svelte/store';
import { calculateItemCost, cart } from './context.svelte';
import { priceFormatter } from '$lib';

export const testaddItemToCart = async (
	selectedProduct: Product,
	selectedVariant: ProductVariant | undefined,
	selectedAddOns: AddOnVariant[]
) => {
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
			value: addOn.value
		}))
	];
	const productVariant = selectedVariant || selectedProduct.variants[0];
	// console.log('selectedProduct', selectedProduct);
	// console.log('selectedVariant', selectedVariant);
	// console.log('selectedAddOns', selectedAddOns);
	// console.log('productVariant', productVariant);
	const cartItemsToCreate = [...updatedAddOns, { ...productVariant, attributes }];
	console.log('cartItemsToCreate', cartItemsToCreate);
	// cartItemsToCreate.forEach((product) => {
	// 	const existingItem = get(cart).lines.find((item) =>
	// 		item.merchandise.id === product.id && item.attributes.length > 0
	// 			? product.attributes.every((addOn) =>
	// 					item.attributes.some((attr) => {
	// 						if (typeof attr.value === 'string') {
	// 							const match = attr.value.match(/^(.+?) \(\+\$/);
	// 							return attr.key === addOn.title && match && match[1] === addOn.value;
	// 						}
	// 						return false;
	// 					})
	// 				)
	// 			: true
	// 	);
	// 	console.log('existingItem', existingItem);
	// });
	cartItemsToCreate.forEach((product) => {
		const existingItem = get(cart).lines.find(
			(item) =>
				item.merchandise.id === product.id &&
				updatedAddOns.every((addOn) =>
					item.attributes.some((attr) => {
						if (typeof attr.value === 'string') {
							const match = attr.value.match(/^(.+?) \(\+\$/);
							return attr.key === addOn.title && match && match[1] === addOn.value;
						}
						return false;
					})
				)
		);
		console.log('existingItem', existingItem);
	});

	// const input = [
	// 	{
	// 		id: 'gid://shopify/ProductVariant/44710921109693',
	// 		title: 'Default Title',
	// 		availableForSale: true,
	// 		quantityAvailable: 4545,
	// 		selectedOptions: [
	// 			{
	// 				name: 'Title',
	// 				value: 'Default Title'
	// 			}
	// 		],
	// 		price: {
	// 			amount: '34.0',
	// 			currencyCode: 'AUD'
	// 		},
	// 		image: null,
	// 		attributes: [
	// 			{
	// 				key: 'Order type',
	// 				value: 'Send-in item'
	// 			}
	// 		]
	// 	}
	// ];
	// const expectedOutput = [
	// 	{
	// 		id: 'gid://shopify/ProductVariant/44710921109693',
	// 		title: 'Default Title',
	// 		availableForSale: true,
	// 		quantityAvailable: 4545,
	// 		selectedOptions: [
	// 			{
	// 				name: 'Title',
	// 				value: 'Default Title'
	// 			}
	// 		],
	// 		price: {
	// 			amount: '34.0',
	// 			currencyCode: 'AUD'
	// 		},
	// 		image: null,
	// 		attributes: [
	// 			{
	// 				key: 'Order type',
	// 				value: 'Send-in item'
	// 			}
	// 		]
	// 	}
	// ];
};
