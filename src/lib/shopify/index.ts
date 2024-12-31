import { HIDDEN_PRODUCT_TAG, SHOPIFY_GRAPHQL_API_ENDPOINT, TAGS } from '$lib/constants';
import { isShopifyError } from '$lib/type-guards';
import { addToCartMutation, createCartMutation } from './mutations/cart';
import { getCartQuery } from './queries/cart';
import { getCollectionProductsQuery, getCollectionsQuery } from './queries/collection';
import type {
	Attributes,
	Cart,
	Collection,
	Connection,
	Image,
	Product,
	ShopifyAddToCartOperation,
	ShopifyCart,
	ShopifyCartOperation,
	ShopifyCollection,
	ShopifyCollectionProductsOperation,
	ShopifyCollectionsOperation,
	ShopifyCreateCartOperation,
	ShopifyProduct
} from './types';

type ExtractVariables<T> = T extends { variables: object } ? T['variables'] : never;

// const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const domain = 'https://humanitixfans.myshopify.com';

// const key = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
const key = '1e1ee830c3cfb7825a1bd501b6a13f25';

const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;

export async function shopifyFetch<T>({
	cache = 'force-cache',
	headers,
	query,
	tags,
	variables
}: {
	cache?: RequestCache;
	headers?: HeadersInit;
	query: string;
	tags?: string[];
	variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
	try {
		const result = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Shopify-Storefront-Access-Token': key!,
				...headers
			},
			body: JSON.stringify({
				...(query && { query }),
				...(variables && { variables })
			}),
			cache,
			...(tags && { next: { tags } })
		});

		const body = await result.json();

		if (body.errors) {
			throw body.errors[0];
		}

		return {
			status: result.status,
			body
		};
	} catch (error) {
		if (isShopifyError(error)) {
			throw {
				cause: error.cause?.toString() || 'unknown',
				status: error.status || 500,
				message: error.message,
				query
			};
		}

		throw {
			error,
			query
		};
	}
}

function reshapeImages(images: Connection<Image>, productTile: string) {
	const flattened = removeEdgesAndNodes(images);
	return flattened.map((image) => {
		const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
		return {
			...image,
			altText: image.altText || `${productTile} - ${filename}`
		};
	});
}

function removeEdgesAndNodes<T>(array: Connection<T>): T[] {
	return array.edges.map((edge) => edge?.node);
}

function reshapeCollections(collection: ShopifyCollection): Collection | undefined {
	if (!collection) return undefined;

	return {
		...collection,
		path: `/search/${collection.handle}`
	};
}

export async function getCollections(): Promise<Collection[]> {
	const res = await shopifyFetch<ShopifyCollectionsOperation>({
		query: getCollectionsQuery,
		tags: [TAGS.collections]
	});

	const shopifyCollections = removeEdgesAndNodes(res?.body?.data?.collections);
	const collections = [
		{
			handle: '',
			title: 'All',
			description: 'All products',
			seo: {
				title: 'All',
				description: 'All products'
			},
			path: '/search',
			updatedAt: new Date().toISOString()
		},
		// Filter out the hidden products
		...shopifyCollections
			.map(reshapeCollections) // Apply reshapeCollections to each item
			.filter((collection) => collection && !collection.handle.startsWith('hidden')) // Filter out hidden collections and undefined
	];

	return collections;
}

function reshapeProduct(product: ShopifyProduct, filterHiddenProducts: boolean = true) {
	if (!product || (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG)))
		return undefined;

	const { images, variants, ...rest } = product;
	return {
		...rest,
		image: reshapeImages(images, product.title),
		variants: removeEdgesAndNodes(variants)
	};
}

function reshapeProducts(products: ShopifyProduct[]) {
	const reshapedProducts = [];

	for (const product of products) {
		if (product) {
			const reshapedProduct = reshapeProduct(product);

			if (reshapedProduct) {
				reshapedProducts.push(reshapedProduct);
			}
		}
	}

	return reshapedProducts;
}

export async function getCollectionProducts({
	collection,
	reverse,
	sortKey
}: {
	collection: string | FormDataEntryValue;
	reverse?: boolean;
	sortKey?: string;
}): Promise<Product[]> {
	const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
		query: getCollectionProductsQuery,
		tags: [TAGS.collections, TAGS.products],
		variables: {
			handle: collection,
			reverse,
			sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
		}
	});

	if (!res.body.data.collection) {
		console.log(`No collection found for \`${collection}\``);
		return [];
	}

	return reshapeProducts(removeEdgesAndNodes(res.body.data.collection.products));
}

function reshapeCart(cart: ShopifyCart): Cart {
	if (!cart.cost?.totalTaxAmount) {
		cart.cost.totalTaxAmount = {
			amount: '0.0',
			currencyCode: 'USD'
		};
	}

	return {
		...cart,
		lines: removeEdgesAndNodes(cart.lines)
	};
}

export async function createCart(): Promise<Cart> {
	const res = await shopifyFetch<ShopifyCreateCartOperation>({
		query: createCartMutation,
		cache: 'no-store'
	});

	return reshapeCart(res.body.data.cartCreate.cart);
}

export async function getCart(cartId: string | undefined): Promise<Cart | undefined> {
	console.log(cartId, 'cartId');
	if (!cartId) return undefined;

	const res = await shopifyFetch<ShopifyCartOperation>({
		query: getCartQuery,
		variables: { cartId },
		tags: [TAGS.cart]
	});

	if (!res.body.data.cart) {
		return undefined;
	}

	return reshapeCart(res.body.data.cart);
}

export async function addToCart(
	cartId: string,
	lines: { merchandiseId: string; quantity: number; attributes: Attributes[] }[]
): Promise<Cart> {
	const res = await shopifyFetch<ShopifyAddToCartOperation>({
		query: addToCartMutation,
		variables: {
			cartId,
			lines
		},
		cache: 'no-cache'
	});

	return reshapeCart(res.body.data.cartLinesAdd.cart);
}
