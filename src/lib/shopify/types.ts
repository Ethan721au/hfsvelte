export type Menu = {
	title: string;
	path: string;
};

export type ShopifyMenuOperation = {
	data: {
		menu?: {
			items: {
				title: string;
				url: string;
			}[];
		};
	};
	variables: {
		handle: string;
	};
};

export type ShopifyProductsOperation = {
	data: {
		products: Connection<ShopifyProduct>;
	};
	variables: {
		query?: string;
		reverse?: boolean;
		sortKey?: string;
	};
};

export type ShopifyProductOperation = {
	data: { product: ShopifyProduct };
	variables: {
		handle: string;
	};
};

export type Edge<T> = {
	node: T;
};

export type ProductOption = {
	id: string;
	name: string;
	values: string[];
};

export type Image = {
	url: string;
	altText: string;
	width: number;
	height: number;
};

export type SEO = {
	title: string;
	description: string;
};

export type ShopifyProduct = {
	id: string;
	handle: string;
	price: Money;
	availableForSale: boolean;
	title: string;
	description: string;
	descriptionHtml: string;
	options: ProductOption[];
	priceRange: {
		maxVariantPrice: Money;
		minVariantPrice: Money;
	};
	variants: Connection<ProductVariant>;
	featuredImage: Image;
	images: Connection<Image>;
	seo: SEO;
	tags: string[];
	productType: string;
	updatedAt: string;
	collections: Connection<ShopifyCollection>;
};

export type Connection<T> = {
	edges: Array<Edge<T>>;
};

export type Money = {
	amount: string;
	currencyCode: string;
};

export type ProductVariant = {
	id: string;
	handle?: string;
	description?: string;
	title: string;
	availableForSale: boolean;
	selectedOptions: {
		name: string;
		value: string;
	}[];
	price: Money;
	featuredImage?: Image;
	image?: Image;
};

export interface AddOnVariant extends ProductVariant {
	checked?: boolean;
	value?: FormDataEntryValue;
}

export type Product = Omit<ShopifyProduct, 'variants' | 'images'> & {
	variants: ProductVariant[];
	images?: Image[];
};

export type CartProduct = {
	id: string;
	handle: string;
	title: string;
	featuredImage: Image;
	productType?: string;
	collections?: Connection<ShopifyCollection>;
	variants?: Connection<ProductVariant>;
};

export type CartItem = {
	id: string;
	attributes: Attributes[];
	quantity: number;
	cost: {
		totalAmount: Money;
	};
	merchandise: {
		id: string;
		title: string;
		selectedOptions: {
			name: string;
			value: string;
		}[];
		product: CartProduct;
	};
};

export type ShopifyCart = {
	id: string;
	checkoutUrl: string;
	cost: {
		subtotalAmount: Money;
		totalAmount: Money;
		totalTaxAmount: Money;
	};
	lines: Connection<CartItem>;
	totalQuantity: number;
};

export type ShopifyCartOperation = {
	data: {
		cart: ShopifyCart;
	};
	variables: {
		cartId: string;
	};
};

export type ShopifyCreateCartOperation = {
	data: { cartCreate: { cart: ShopifyCart } };
};

export type ShopifyUpdateCartOperation = {
	data: {
		cartLinesUpdate: {
			cart: ShopifyCart;
		};
	};
	variables: {
		cartId: string;
		lines: {
			id: string;
			merchandiseId: string;
			quantity: number;
		}[];
	};
};

export type Attributes = {
	key: string;
	value: FormDataEntryValue;
};

export type Cart = Omit<ShopifyCart, 'lines'> & {
	lines: CartItem[];
};

export type ShopifyAddToCartOperation = {
	data: {
		cartLinesAdd: {
			cart: ShopifyCart;
		};
	};
	variables: {
		cartId: string;
		lines: {
			merchandiseId: string;
			quantity: number;
			attributes: Attributes[];
		}[];
	};
};

export type Collection = ShopifyCollection & {
	path: string;
};

export type ShopifyCollection = {
	handle: string;
	title: string;
	image: Image;
	description: string;
	seo: SEO;
	updatedAt: string;
};

export type ShopifyCollectionsOperation = {
	data: {
		collections: Connection<ShopifyCollection>;
	};
};

export type ShopifyCollectionProductsOperation = {
	data: {
		collection: {
			products: Connection<ShopifyProduct>;
		};
	};
	variables: {
		handle: string | FormDataEntryValue;
		reverse?: boolean;
		sortKey?: string;
	};
};

export type ShopifyUpdateCartAttributesOperation = {
	data: {
		cartAttributesUpdate: {
			cart: ShopifyCart;
		};
	};
	variables: {
		cartId: string;
		attributes: Attributes[];
	};
};

export type ShopifyRemoveFromCartOperation = {
	data: {
		cartLinesRemove: {
			cart: ShopifyCart;
		};
	};
	variables: {
		cartId: string;
		lineIds: string[];
	};
};
