import { useQuery } from "@tanstack/react-query";
import { listActiveProducts } from "@/lib/products.functions";
import { categories, type Product, type CategorySlug, type ProductTag, type OptionType } from "@/data/products";

type Row = {
  id:string; name:{fa:string;en:string}; price:number; old_price:number|null; category:string;
  subcategory:string|null; short:{fa:string;en:string}; description:{fa:string;en:string};
  specs: Product["specs"]; options: Array<{ type: string; values: Array<{ fa: string; en: string }> }>;
  images:string[]; tags:string[]; added_order:number; stock_quantity:number|null;
};

/** Keep originals in owned storage; deliver responsive, resized WebP variants through the image CDN. */
export function optimizedProductImage(url: string, width = 480): string {
  if (!url || url.startsWith("/") || url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return url;
    if (parsed.hostname === "images.weserv.nl") return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(parsed.host + parsed.pathname + parsed.search)}&w=${width}&h=${width}&fit=contain&output=webp&q=70`;
  } catch {
    return url;
  }
}

function mapProduct(row:Row):Product {
  const category = categories.some(c=>c.slug===row.category) ? row.category as CategorySlug : "gadgets";
  const allowedOptions:OptionType[]=["model","color","size","design"];
  return {
    id:row.id,name:row.name,price:Number(row.price),
    ...(row.old_price == null ? {} : { oldPrice: Number(row.old_price) }),
    category,...(row.subcategory == null ? {} : { subcategory: row.subcategory }),short:row.short,description:row.description,
    specs:Array.isArray(row.specs)?row.specs:[],
    options:Array.isArray(row.options)?row.options.filter(o=>allowedOptions.includes(o.type as OptionType)).map(o=>({type:o.type as OptionType,values:Array.isArray(o.values)?o.values:[]})):[],
    images:Array.isArray(row.images)&&row.images.length?row.images:["/favicon.svg"],
    tags:Array.isArray(row.tags)?row.tags.filter(t=>["trending","pick","recommended"].includes(t)) as ProductTag[]:[],
    addedOrder:Number(row.added_order)||0,
  };
}
export function useCatalogProducts() {
  return useQuery({
    queryKey:["public-catalog"],
    queryFn:async()=>{const result=await listActiveProducts();return (result.products as unknown as Row[]).filter(row=>row.stock_quantity===null||row.stock_quantity>0).map(mapProduct);},
    // Keep public catalog data warm while customers move between storefront pages.
    staleTime: 120_000,
  });
}
export function filterCatalogProducts(products:Product[],opts:{q?:string|undefined;cat?:string|undefined;sub?:string|undefined;sale?:boolean|undefined;min?:number|undefined;max?:number|undefined;sort?:string|undefined}) {
  const q=opts.q?.trim().toLowerCase();
  const list=products.filter(p=>{
    if(opts.cat&&p.category!==opts.cat)return false;
    if(opts.sub&&p.subcategory!==opts.sub)return false;
    if(opts.sale&&!(p.oldPrice&&p.oldPrice>p.price))return false;
    if(opts.min!=null&&p.price<opts.min)return false;
    if(opts.max!=null&&p.price>opts.max)return false;
    if(q&&![`${p.name.fa} ${p.name.en} ${p.short.fa} ${p.short.en}`].join(" ").toLowerCase().includes(q))return false;
    return true;
  });
  if(opts.sort==="price-asc")return [...list].sort((a,b)=>a.price-b.price);
  if(opts.sort==="price-desc")return [...list].sort((a,b)=>b.price-a.price);
  return [...list].sort((a,b)=>b.addedOrder-a.addedOrder);
}
