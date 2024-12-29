<script lang="ts">
	import type { Product, ProductVariant } from '$lib/shopify/types';
	import { Label, Wrapper } from './styled';

	export let type: string;
	export let name: string;
	export let label: string | undefined;
	export let bold: boolean;
	export let product: Product;
	export let options: Product[] | ProductVariant[];
	export let selectedProduct: string;
	export let onChange: (e: boolean | string) => void;
	export let checked: boolean;
	export let value: FormDataEntryValue | undefined | string;
</script>
