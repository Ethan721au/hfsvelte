<script lang="ts">
	import { cart } from '$lib/Cart/final.svelte';
	import './header.css';
	console.log($cart, 'headerCart');
</script>

<div class="header-wrapper">
	<a href="/" class="logo-wrapper">
		<div class="logo-left-section">
			<img src="/logo.svg" alt="logo" />
			<div class="logo-left-section-text">for fans</div>
		</div>
		<div class="logo-divider"></div>
		<div class="logo-right-section">
			<div class="logo-right-section-top-text">Powered by</div>
			<div class="logo-right-section-bottom-text">Hugh Jackman</div>
		</div>
	</a>
	<a href="/cart" class="cart-icon-wrapper">
		<img src="/cartIcon.svg" alt="Cart" />
		<div class="count-bubble">{$cart.totalQuantity}</div>
	</a>
</div>
