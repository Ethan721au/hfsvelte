// place files you want to import through the `$lib` alias in this folder.
export const priceFormatter = (price: string | number, decimals: number) => {
	return `$${Number(price).toFixed(decimals)}`;
};
