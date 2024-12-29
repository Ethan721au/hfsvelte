<script lang="ts">
	import type { Product, ProductVariant } from '$lib/shopify/types';
	import './input.css';

	type InputProps = {
		type: string;
		name?: string;
		label?: string | undefined;
		bold?: boolean;
		product?: Product;
		options?: Product[] | ProductVariant[];
		selectedProduct?: string;
		onChange?: (e: boolean | string) => void;
		checked?: boolean;
		value?: FormDataEntryValue | undefined | string;
	};

	let {
		type,
		name,
		label,
		bold,
		product,
		options,
		selectedProduct,
		onChange,
		checked,
		value
	}: InputProps = $props();
	console.log(type, 'props');
</script>

<div class={`input-wrapper ${type}`}>dfsd</div>
