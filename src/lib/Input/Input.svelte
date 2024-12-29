<script lang="ts">
	import ProductForm from '$lib/ProductForm/ProductForm.svelte';
	import type { Product, ProductVariant } from '$lib/shopify/types';
	import { Label, Wrapper } from './styled';

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
