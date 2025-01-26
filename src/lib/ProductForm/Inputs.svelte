<script lang="ts">
	import type { AddOnVariant, Collection, Product, ProductVariant } from '$lib/shopify/types';
	type InputsProps = {
		selectedProduct: Product | undefined;
		selectedVariant: ProductVariant | undefined;
		selectedAddOns: AddOnVariant[];
		collection: Collection;
		onChange: (e: Event) => void;
	};

	let { selectedProduct, selectedVariant, selectedAddOns, collection, onChange }: InputsProps =
		$props();
</script>

<div>inputs</div>
