import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreContent = Record<string, any>;

export function useStoreContent() {
  return useQuery({
    queryKey: ["store-content"],
    queryFn: async (): Promise<StoreContent> => {
      const { data, error } = await supabase.from("store_content").select("key,value");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
    },
    staleTime: 30_000,
    retry: 1,
  });
}
