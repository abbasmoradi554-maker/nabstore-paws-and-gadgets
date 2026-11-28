import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeOptions, type CartItemInput } from "./order-pricing";
import { useCatalogProducts } from "./catalog";

const STORAGE_KEY = "nabstore-cart";
const MAX_QTY = 20;
export type CartItem = CartItemInput & { key: string };
export function cartKey(id:string,options:Record<string,string>){return `${id}::${Object.keys(options).sort().map(k=>`${k}=${options[k]}`).join("|")}`;}
function sanitizeCart(raw:unknown,products:ReturnType<typeof useCatalogProducts>["data"]):CartItem[]{
 if(!Array.isArray(raw)||!products)return [];
 const out:CartItem[]=[];
 for(const r of raw){if(!r||typeof r!=="object")continue;const {id,qty,options}=r as Record<string,unknown>;if(typeof id!=="string")continue;
  const product=products.find(p=>p.id===id);
  const rawOptions=options&&typeof options==="object"&&!Array.isArray(options)?options as Record<string,unknown>:{};
  const safeOptions=Object.fromEntries(Object.entries(rawOptions).filter((entry):entry is [string,string]=>typeof entry[1]==="string").slice(0,8));
  const opts=product?normalizeOptions(product,safeOptions):safeOptions;
  if(!opts)continue;
  const available=product?.stockQuantity;
  if(typeof available==="number"&&available<=0) {
    out.push({key:cartKey(id,opts),id,qty:Math.max(1,Math.min(MAX_QTY,typeof qty==="number"?Math.floor(qty):1)),options:opts});
    continue;
  }
  const max=typeof available==="number"?Math.min(MAX_QTY,available):MAX_QTY;
  const q=typeof qty==="number"?Math.max(1,Math.min(max,Math.floor(qty))):1;
  out.push({key:cartKey(id,opts),id,qty:q,options:opts});
 }return out;
}
type CartValue={items:CartItem[];count:number;total:number;ready:boolean;catalogError:boolean;retryCatalog:()=>void;add:(id:string,options:Record<string,string>,qty?:number)=>void;setQty:(key:string,qty:number)=>void;remove:(key:string)=>void;clear:()=>void};
const CartContext=createContext<CartValue|null>(null);
export function CartProvider({children}:{children:ReactNode}){
 const catalog=useCatalogProducts();const products=catalog.data;
 const [items,setItems]=useState<CartItem[]>([]);const [ready,setReady]=useState(false);
 useEffect(()=>{if(!products)return;try{setItems(sanitizeCart(JSON.parse(window.localStorage.getItem(STORAGE_KEY)??"[]"),products));}catch{setItems([]);}setReady(true);},[products]);
 useEffect(()=>{if(!ready)return;window.localStorage.setItem(STORAGE_KEY,JSON.stringify(items.map(({id,qty,options})=>({id,qty,options}))));},[items,ready]);
 const add=useCallback((id:string,options:Record<string,string>,qty=1)=>{const product=products?.find(p=>p.id===id);if(!product)return;const opts=normalizeOptions(product,options);if(!opts)return;const key=cartKey(id,opts);const max=typeof product.stockQuantity==="number"?Math.min(MAX_QTY,product.stockQuantity):MAX_QTY;if(max<1)return;setItems(prev=>{const old=prev.find(i=>i.key===key);return old?prev.map(i=>i.key===key?{...i,qty:Math.min(max,i.qty+qty)}:i):[...prev,{key,id,qty:Math.min(max,Math.max(1,qty)),options:opts}];});},[products]);
 const setQty=useCallback((key:string,qty:number)=>setItems(prev=>prev.map(i=>{if(i.key!==key)return i;const product=products?.find(p=>p.id===i.id);const max=typeof product?.stockQuantity==="number"?Math.min(MAX_QTY,product.stockQuantity):MAX_QTY;return {...i,qty:Math.max(1,Math.min(max,qty))};})),[products]);
 const remove=useCallback((key:string)=>setItems(prev=>prev.filter(i=>i.key!==key)),[]);
 const clear=useCallback(()=>setItems([]),[]);
 const value=useMemo<CartValue>(()=>{const count=items.reduce((s,i)=>s+i.qty,0);const total=items.reduce((s,i)=>s+(products?.find(p=>p.id===i.id)?.price??0)*i.qty,0);return{items,count,total,ready:ready&&catalog.isSuccess,catalogError:catalog.isError,retryCatalog:()=>{void catalog.refetch();},add,setQty,remove,clear};},[items,products,ready,catalog.isSuccess,catalog.isError,catalog.refetch,add,setQty,remove,clear]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(){const ctx=useContext(CartContext);if(!ctx)throw new Error("useCart must be used inside CartProvider");return ctx;}
export const CART_MAX_QTY=MAX_QTY;
