<script lang="ts">
	import { priceFormatter } from '$lib';
	import Input from '$lib/Input/Input.svelte';
	import { getCollectionProducts } from '$lib/shopify';
	import type {
		AddOnVariant,
		CartItem,
		Collection,
		Product,
		ProductVariant
	} from '$lib/shopify/types';
	import { onMount } from 'svelte';
	import {
		addItemToCart,
		cart,
		isCartEdit,
		isCartUpdate,
		editItemFromCart,
		type UpdateType
	} from '$lib/Cart/final.svelte';

	type ProductFormProps = {
		collection: Collection;
		cartItem?: CartItem;
	};

	let { collection, cartItem }: ProductFormProps = $props();
	let collectionProducts: Product[] = $state([]);
	let selectedProduct: Product | undefined = $state(undefined);
	let selectedVariant: ProductVariant | undefined = $state(undefined);
	let selectedAddOns: AddOnVariant[] = $state([]);
	let products: Product[] = $derived(collectionProducts.filter((p) => p.productType === 'product'));
	let productsWithVariants: Product[] = $derived(
		products?.filter((product) => product.variants.length > 1)
	);
	let productVariants: ProductVariant[] | undefined = $derived(
		productsWithVariants.find((p) => p.title === selectedProduct?.title)?.variants
	);
	let addOns = $derived(collectionProducts.filter((p) => p.productType === 'add-on')[0]);

	$effect(() => {
		if ($cart && $isCartEdit && cartItem) {
			selectedProduct = cartItem.merchandise.product;

			selectedVariant = cartItem.merchandise.product?.variants?.edges.find(
				(v) => v.node.title === cartItem.merchandise.selectedOptions[0].value
			)?.node;

			if (addOns) {
				const matchedAddons = addOns.variants.filter((addon) =>
					cartItem.attributes.some((attribute) => attribute.key === addon.title)
				);

				selectedAddOns = matchedAddons.map((addOn) => ({
					...addOn,
					checked: true,
					value: (() => {
						const attributeValue = cartItem.attributes.find(
							(attribute) => attribute.key === addOn.title
						)?.value;

						if (typeof attributeValue === 'string') {
							const match = attributeValue.match(/^(.+?) \(\+\$/);
							return match ? match[1] : '';
						}

						return '';
					})()
				}));
			}
		}
	});

	const handleSubmit = async (event: Event) => {
		isCartUpdate.set(true);
		event.preventDefault();
		const submitter = (event as SubmitEvent).submitter as HTMLButtonElement;
		const updateType = submitter?.name as UpdateType;

		switch (updateType) {
			case 'add':
				if (!selectedProduct) {
					return 'Please select a product';
				}

				await addItemToCart(selectedProduct, selectedVariant, selectedAddOns);

				isCartUpdate.set(false);

				break;

			case 'edit':
				if (!selectedProduct) {
					return 'Please select a product';
				}
				if (!cart || !cartItem) return 'no item to edit';
				isCartEdit.set(false);

				await editItemFromCart(selectedProduct, selectedVariant, selectedAddOns, cartItem);

				isCartUpdate.set(false);

				break;
		}
	};

	const handleAddOnChange = (addOn: AddOnVariant, checked: boolean) => {
		const existingAddOnIndex = selectedAddOns.findIndex((a) => a.id === addOn.id);

		if (existingAddOnIndex !== -1) {
			selectedAddOns = selectedAddOns
				.map((addOn, index) => (index === existingAddOnIndex ? { ...addOn, checked } : addOn))
				.filter((a) => checked || a.id !== addOn.id);
		} else if (checked) {
			selectedAddOns.push({
				...addOn,
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

	const handleProductChange = (productTitle: string) => {
		selectedProduct = products.find((p) => p.title === productTitle);
		if (!productVariants) {
			selectedVariant = undefined;
		}
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
		<div style="display: flex; flex-direction: column;">
			{#if collection.title === 'Send-in item' && products}
				<div style="display: flex; flex-direction: column;">
					<Input
						type="text"
						name={collection?.title}
						bold
						label={`${collection?.title} *`}
						selectedProduct={selectedProduct?.title || 'default'}
						onChange={(product) => handleProductChange(product as string)}
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
				</div>
			{/if}
			{#if collection.title === 'Item from store' && products}
				<strong>{`${collection.title} *`}</strong>
				<div style="display: flex; flex-direction: column; gap: 10px">
					{#each products as product}
						<Input
							type="radio"
							name={collection?.title}
							label={`${product.title} (+$${Number(product?.variants[0].price.amount).toFixed(0)})`}
							selectedProduct={selectedProduct?.title}
							{product}
							onChange={(product) => handleProductChange(product as string)}
						/>
					{/each}
				</div>
			{/if}
			{#if addOns}
				{#each addOns.variants as addOn (addOn.id)}
					<Input
						type="checkbox"
						label={`${addOn.title} (+${priceFormatter(addOn?.price.amount, 0)})`}
						name={addOn.title}
						checked={selectedAddOns?.find((a) => a.id === addOn.id)?.checked || false}
						onChange={(checked) => handleAddOnChange(addOn, checked as boolean)}
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
		<button type="submit" name={$isCartEdit ? 'edit' : 'add'} disabled={$isCartUpdate}
			>{$isCartEdit ? ($isCartUpdate ? 'updating...' : 'update item') : 'add to cart'}</button
		>
	</form>
</div>
