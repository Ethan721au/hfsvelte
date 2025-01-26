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
		onChange: (e: boolean | string) => void;
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
	{#if name !== 'Send-in item' && name !== 'variant'}
		<input
			{type}
			{name}
			id={name === 'Item from store' ? product?.id : name}
			value={name === 'Item from store' ? product?.title : typeof value === 'string' ? value : ''}
			{checked}
			onchange={(e) =>
				onChange(
					name === 'Item from store'
						? (e.target as HTMLSelectElement).value
						: (e.target as HTMLSelectElement).value || (e.target as HTMLInputElement).checked
				)}
		/>
	{/if}
	<label for={product?.id || name} class={bold ? 'bold' : ''}>
		<div style="display: flex; align-items: center; gap: 10px;">
			{#if product?.featuredImage}
				<div class="image-wrapper">
					<img
						class="image-container"
						src={product.featuredImage.url}
						alt={product.title}
						width="40"
						height="40"
					/>
				</div>
			{/if}
			{label}
		</div>
	</label>
	{#if name === 'Send-in item' || name === 'variant'}
		<select
			class="product-options"
			id={name}
			{name}
			value={selectedProduct}
			onchange={(e) => onChange((e.target as HTMLSelectElement).value)}
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
