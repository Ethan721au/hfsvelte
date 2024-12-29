import imageFragment from './image';
import seoFragment from './seo';

const productFragment = /* GraphQl */ `
    fragment product on Product {
    id
    handle
    availableForSale
    totalInventory
    title
    description
    descriptionHtml
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          image {
            ...image
           }
        }
      }
    }
    featuredImage {
      ...image
    }
    images(first: 20) {
      edges {
        node {
          ...image
        }
      }
    }
    collections(first: 5) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
    seo {
      ...seo
    }
    tags
    productType
    updatedAt
    }
    ${imageFragment}
    ${seoFragment}
`;

export default productFragment;
