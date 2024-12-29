<script lang="ts">
	import { priceFormatter } from '$lib';
	import type { CartProvider } from '$lib/cartContext.svelte';
	import { addOnsKeys } from '$lib/constants';
	import Input from '$lib/Input/Input.svelte';
	import { getCollectionProducts } from '$lib/shopify';
	import type { Attributes, Collection, Product, ProductVariant } from '$lib/shopify/types';
	import { getContext, onMount } from 'svelte';

	type AddOn = {
		id: string;
		title: string;
		checked: boolean;
		value?: FormDataEntryValue | undefined;
	};

	type Line = {
		merchandiseId: string;
		quantity: number;
		attributes: { key: string; value: FormDataEntryValue }[];
	};

	const { updateCart } = getContext<CartProvider>('cart');
	let { collection }: { collection: Collection } = $props();
	let collectionProducts: Product[] = $state([]);
	let selectedProduct: Product | undefined = $state(undefined);
	let selectedVariant: ProductVariant | undefined = $state(undefined);
	let selectedAddOns: AddOn[] = $state([]);
	let products: Product[] = $derived(collectionProducts.filter((p) => p.productType === 'product'));
	let productsWithVariants: Product[] = $derived(
		products?.filter((product) => product.variants.length > 1)
	);
	let productVariants: ProductVariant[] | undefined = $derived(
		productsWithVariants.find((p) => p.title === selectedProduct?.title)?.variants
	);
	let addOns = $derived(collectionProducts?.filter((p) => p.productType === 'add-on')[0]?.variants);

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const { lines, products } = await prepareItems(formData);

		pepareCart(lines, products, updateCart);
	};

	const prepareItems = async (formData: FormData) => {
		const items = Object.fromEntries(formData.entries());
		const products = await getCollectionProducts({
			collection: items.collection as string
		});
		const product = products.find((p) => p.title === items[collection!.title]);
		const variant =
			product?.variants.find((v) => v.title === items.variant) || product?.variants[0];
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

		return {
			lines,
			products
		};
	};

	const pepareCart = (
		lines: Line[],
		products: Product[],
		updateCart: (variant: ProductVariant, product: Product, attributes: Attributes[]) => void
	) => {
		lines.map((line) => {
			const product = products.find((p) => p.variants.some((v) => v.id === line.merchandiseId));
			const variant = product?.variants.find((v) => v.id === line.merchandiseId);
			const attributes = line.attributes.map((attr) => ({
				key: attr.key,
				value: attr.value
			}));

			if (variant && product) {
				updateCart(variant, product, attributes);
			} else {
				console.error('Skipping item due to missing product or variant:', line);
			}
		});
	};

	const handleAddOnChange = (addOnId: string, checked: boolean) => {
		const isExisting = selectedAddOns.some((a) => a.id === addOnId);
		if (isExisting) {
			selectedAddOns = selectedAddOns.map((addOn) =>
				addOn.id === addOnId ? { ...addOn, checked } : addOn
			);
		} else {
			selectedAddOns.push({
				id: addOnId,
				title: addOnId,
				checked,
				value: ''
			});
		}
	};

	const handleAddOnValueChange = (addOnId: string, value: string) => {
		selectedAddOns = selectedAddOns.map((addOn) =>
			addOn.id === addOnId ? { ...addOn, value } : addOn
		);
	};

	onMount(async () => {
		if (collection) {
			collectionProducts = await getCollectionProducts({ collection: collection.handle });
		}
	});
</script>

<div>
	<form onsubmit={handleSubmit}>
		<input type="hidden" name="collection" value={collection?.handle} />
		{#if collection.title === 'Send-in item' && products}
			<div style="display: flex; flex-direction: column;">
				<Input
					type="text"
					name={collection?.title}
					bold
					label={`${collection?.title} *`}
					selectedProduct={selectedProduct?.title || 'default'}
					onChange={(product) => {
						selectedProduct = products.find((p) => p.title === (product as string));
					}}
					options={products}
				/>
				{#if productVariants}
					<Input
						type="text"
						label={`${productVariants[0]?.selectedOptions[0]?.name} *`}
						selectedProduct={selectedVariant?.title || 'default'}
						name="variant"
						bold
						options={productVariants}
						onChange={(variant) => {
							selectedVariant = productVariants.find((p) => p.title === (variant as string));
						}}
					/>
				{/if}
				{#if addOns}
					{#each addOns as addOn (addOn.id)}
						<Input
							type="checkbox"
							label={`${addOn.title} (+${priceFormatter(addOn?.price.amount, 0)})`}
							name={addOn.title}
							checked={selectedAddOns?.find((a) => a.id === addOn.id)?.checked || false}
							onChange={(checked) => handleAddOnChange(addOn.id, checked as boolean)}
						/>
						{#if selectedAddOns.find((a) => a.id === addOn.id)?.checked}
							<Input
								label={`${addOn.title} *`}
								type="text"
								name={addOn.title}
								bold
								value={selectedAddOns.find((a) => a.id === addOn.id)?.value || ''}
								onChange={(value) => handleAddOnValueChange(addOn.id, value as string)}
							/>
						{/if}
					{/each}
				{/if}
			</div>
		{/if}
		<button type="submit">add to cart</button>
	</form>
</div>
