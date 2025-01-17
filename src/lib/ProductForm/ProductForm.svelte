<script lang="ts">
	import { priceFormatter } from '$lib';
	import Input from '$lib/Input/Input.svelte';
	import { getCollectionProducts } from '$lib/shopify';
	import type { CartItem, Collection, Product, ProductVariant } from '$lib/shopify/types';
	import { onMount } from 'svelte';

	import {
		pleaseAddItemToCart,
		pleaseEditCartItem,
		pleaseRemovefromCart,
		type AddOn,
		type UpdateType
	} from '$lib/Cart/actions';
	import { addItemtoCart, cart, isCartEdit, isCartUpdate } from '$lib/Cart/context.svelte';

	type ProductFormProps = {
		collection: Collection;
		cartItem?: CartItem;
	};

	let { collection, cartItem }: ProductFormProps = $props();
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
	let addOns = $derived(collectionProducts.filter((p) => p.productType === 'add-on')[0]);
	let message = $state('');

	$effect(() => {
		if ($cart && $isCartEdit && cartItem) {
			selectedProduct = cartItem.merchandise.product;

			selectedVariant = cartItem.merchandise.product.variants?.edges.find(
				(v) => v.node.title === cartItem.merchandise.selectedOptions[0].value
			)?.node;

			if (addOns) {
				const matchedAddons = addOns.variants.filter((addon) =>
					cartItem.attributes.some((attribute) => attribute.key === addon.title)
				);

				selectedAddOns = matchedAddons.map((addon) => ({
					id: addon.id,
					title: addon.title,
					checked: true,
					value: cartItem.attributes.find((attribute) => attribute.key === addon.title)?.value ?? ''
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
				addItemtoCart(selectedProduct, selectedVariant, selectedAddOns, addOns, collection);
				// message = await pleaseAddItemToCart(
				// 	selectedProduct,
				// 	selectedVariant,
				// 	selectedAddOns,
				// 	addOns,
				// 	collection
				// );
				// if (message === 'completed') isCartUpdate.set(false);

				break;
			case 'delete':
				if (!cartItem || !cart) return 'no item to delete';
				isCartEdit.set(false);
				message = await pleaseRemovefromCart(cartItem);
				if (message === 'completed') isCartUpdate.set(false);

				break;
			case 'edit':
				if (!selectedProduct) {
					return 'Please select a product';
				}
				if (!cart || !cartItem) return 'no item to delete';
				isCartEdit.set(false);
				message = await pleaseEditCartItem(
					selectedProduct,
					selectedVariant,
					selectedAddOns,
					addOns,
					cartItem,
					collection
				);
				if (message === 'completed') isCartUpdate.set(false);

				break;
		}
	};

	const handleAddOnChange = (addOnId: string, addOnTitle: string, checked: boolean) => {
		const existingAddOnIndex = selectedAddOns.findIndex((addOn) => addOn.id === addOnId);

		if (existingAddOnIndex !== -1) {
			selectedAddOns = selectedAddOns
				.map((addOn, index) => (index === existingAddOnIndex ? { ...addOn, checked } : addOn))
				.filter((addOn) => checked || addOn.id !== addOnId);
		} else if (checked) {
			selectedAddOns.push({
				id: addOnId,
				title: addOnTitle,
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
				{#if addOns}
					{#each addOns.variants as addOn (addOn.id)}
						<Input
							type="checkbox"
							label={`${addOn.title} (+${priceFormatter(addOn?.price.amount, 0)})`}
							name={addOn.title}
							checked={selectedAddOns?.find((a) => a.id === addOn.id)?.checked || false}
							onChange={(checked) => handleAddOnChange(addOn.id, addOn.title, checked as boolean)}
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
		<button type="submit" name={$isCartEdit ? 'edit' : 'add'} disabled={$isCartUpdate}
			>{$isCartEdit ? ($isCartUpdate ? 'updating...' : 'update item') : 'add to cart'}</button
		>
		{#if $isCartEdit}
			<button type="submit" name="delete"
				>{cartItem!.quantity > 1
					? `remove ALL items (${cartItem?.quantity}) from cart`
					: 'remove item from cart'}</button
			>
		{/if}
	</form>
	<!-- <a href={cart.checkoutUrl}>Go to checkout</a> -->
</div>
