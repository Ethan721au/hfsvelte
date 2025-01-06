// place files you want to import through the `$lib` alias in this folder.
// export const priceFormatter = (price: string | number, decimals: number) => {
// 	return `$${Number(price).toFixed(decimals)}`;
// };
export const priceFormatter = (price: string | number, decimals: number) => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
	return formatter.format(Number(price));
};
