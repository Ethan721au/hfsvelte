import cartFragment from '../fragments/cart';

export const addToCartMutation = /* GraphQL */ `
	mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
		cartLinesAdd(cartId: $cartId, lines: $lines) {
			cart {
				...cart
			}
		}
	}
	${cartFragment}
`;

export const createCartMutation = /* GraphQL */ `
	mutation createCart($lineItems: [CartLineInput!]) {
		cartCreate(input: { lines: $lineItems }) {
			cart {
				...cart
			}
		}
	}
	${cartFragment}
`;

export const cartAttributesUpdates = /* GraphQL */ `
	mutation cartAttributesUpdate($attributes: [AttributeInput!]!, $cartId: ID!) {
		cartAttributesUpdate(attributes: $attributes, cartId: $cartId) {
			cart {
				...cart
			}
		}
	}
	${cartFragment}
`;