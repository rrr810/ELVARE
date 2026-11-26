import { createClient } from '@supabase/supabase-js';
import type { ColorOption, Department, Product } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function mapDatabaseProduct(row: Record<string, unknown>): Product {
  const colors = Array.isArray(row.colors)
    ? (row.colors as ColorOption[]).filter((color) => typeof color?.name === 'string' && typeof color?.hex === 'string')
    : [];
  const department = row.department === 'Men' || row.department === 'Women' ? row.department : 'Unisex';
  const sizes = Array.isArray(row.sizes) && row.sizes.length ? row.sizes.map(String) : ['One size'];

  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? 'ÉLVARÉ piece'),
    department: department as Department,
    category: String(row.category ?? 'Accessories'),
    collection: String(row.collection ?? 'Signature Collection'),
    priceKsh: Number(row.price_ks ?? 0),
    description: String(row.description ?? ''),
    material: String(row.material ?? 'Details coming soon'),
    sizes,
    colors: colors.length ? colors : [{ name: 'ÉLVARÉ gold', hex: '#c7a66a' }],
    image: String(row.image_url ?? '/images/editorial-hero.webp'),
    stock: Number(row.stock ?? 0),
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
    isBestSeller: Boolean(row.is_best_seller),
    isActive: Boolean(row.is_active ?? true),
  };
}

export type OrderSubmission = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  county: string;
  town: string;
  items: Array<{ productId: string; quantity: number; size: string; color: string }>;
};

export async function submitDemoOrder(order: OrderSubmission) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.rpc('place_demo_order', {
    p_customer_name: order.customerName,
    p_customer_email: order.email,
    p_customer_phone: order.phone,
    p_delivery_address: order.address,
    p_county: order.county,
    p_town: order.town,
    p_items: order.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object' || !('order_id' in row)) {
    throw new Error('The order was not returned. Please try again.');
  }
  return row as { order_id: string; subtotal_ks: number; delivery_fee_ks: number; total_ks: number };
}

export async function submitContactMessage(input: { name: string; email: string; message: string }) {
  if (!supabase) return false;
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
  });
  if (error) throw error;
  return true;
}

export async function subscribeNewsletter(email: string) {
  if (!supabase) return false;
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
  if (error) throw error;
  return true;
}
