export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SXID3vKdUMfOWW',
    priceId: 'price_1RcDdEFVqC8fbxB6yHGeRaiP',
    name: 'Proofbound Elite Service',
    description: 'Personal attention from our experienced book-writing team',
    mode: 'payment',
    price: 99.00,
    currency: 'usd'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};