import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEMO_PRODUCTS } from '../data/products';
import type { Product } from '../types';
import { mapDatabaseProduct, supabase } from '../lib/supabase';

type CatalogContextValue = {
  products: Product[];
  isLoading: boolean;
  dataMode: 'demo' | 'live';
  catalogMessage: string;
  refreshCatalog: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [dataMode, setDataMode] = useState<'demo' | 'live'>('demo');
  const [catalogMessage, setCatalogMessage] = useState('');

  const refreshCatalog = useCallback(async () => {
    if (!supabase) {
      setProducts(DEMO_PRODUCTS);
      setDataMode('demo');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      setProducts(DEMO_PRODUCTS);
      setDataMode('demo');
      setCatalogMessage('The live catalog could not be reached. Showing clearly labelled sample pieces instead.');
    } else if (data?.length) {
      setProducts(data.map((row) => mapDatabaseProduct(row as Record<string, unknown>)));
      setDataMode('live');
      setCatalogMessage('');
    } else {
      setProducts(DEMO_PRODUCTS);
      setDataMode('demo');
      setCatalogMessage('No live products have been added yet. Showing sample pieces while the catalog is prepared.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const value = useMemo(
    () => ({ products, isLoading, dataMode, catalogMessage, refreshCatalog }),
    [products, isLoading, dataMode, catalogMessage, refreshCatalog],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider.');
  return context;
}
