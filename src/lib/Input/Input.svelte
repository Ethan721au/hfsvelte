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
</script>

<div class={`input-wrapper ${type}`}>
	{#if name !== 'Send-in item' && name !== 'variant' && name !== 'Item from store'}
		<input
			{type}
			{name}
			{checked}
			id={name}
			value={typeof value === 'string' ? value : ''}
			onchange={(e) =>
				onChange?.((e.target as HTMLSelectElement).value || (e.target as HTMLInputElement).checked)}
		/>
	{/if}
	<label for={product?.id || name} class={bold ? 'bold' : ''}>
		{label}
	</label>
	{#if name === 'Send-in item' || name === 'variant'}
		<select
			class="product-options"
			id={name}
			{name}
			value={selectedProduct}
			onchange={(e) => onChange?.((e.target as HTMLSelectElement).value)}
		>
			<option value="default" disabled> --Select a product-- </option>
			{#if options}
				{#each options as option (option.id)}
					<option value={option.title}>
						{option.title}
					</option>
				{/each}
			{/if}
		</select>
	{/if}
</div>
