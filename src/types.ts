export type Department = 'Men' | 'Women' | 'Unisex';

export type ColorOption = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  department: Department;
  category: string;
  collection: string;
  priceKsh: number;
  description: string;
  material: string;
  sizes: string[];
  colors: ColorOption[];
  image: string;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive?: boolean;
};

export type CartLine = {
  key: string;
  product: Product;
  size: string;
  color: ColorOption;
  quantity: number;
};

export type StoreOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  county: string;
  town: string;
  subtotal_ks: number;
  delivery_fee_ks: number;
  total_ks: number;
  status: string;
  created_at: string;
};
