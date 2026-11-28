import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://feature-store-admin-cms-nabstore-paws-and-gadgets.abbasmoradi554.workers.dev",
  "https://nabstore-paws-and-gadgets.nabstore.workers.dev",
]);

function headersFor(request: Request) {
  const origin = request.headers.get("Origin") ?? "";
  const headers: Record<string,string> = {
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function json(request: Request, body: unknown, status=200) {
  return new Response(JSON.stringify(body), {status, headers: headersFor(request)});
}
function digits(value: string) {
  return value.replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x06f0))
    .replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x0660)).replace(/[\s-]/g,"");
}
function allowedPublishableKeys() {
  const keys = new Set<string>();
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string,unknown>;
      for (const value of Object.values(parsed)) if (typeof value==="string" && value.startsWith("sb_publishable_")) keys.add(value);
    } catch { /* invalid config handled as unavailable */ }
  }
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) keys.add(legacy);
  return keys;
}
function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string,unknown>;
        const candidate = parsed.default;
        if (typeof candidate==="string" && candidate.startsWith("sb_secret_")) key = candidate;
      } catch { /* handled below */ }
    }
  }
  if (!url || !key) throw new Error("server_configuration_missing");
  const customFetch: typeof fetch = (input,init) => {
    const h = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((v,k)=>h.set(k,v));
    if (key!.startsWith("sb_secret_") && h.get("Authorization")===`Bearer ${key}`) h.delete("Authorization");
    h.set("apikey",key!);
    return fetch(input,{...init,headers:h});
  };
  return createClient(url,key,{global:{fetch:customFetch},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}

Deno.serve(async (request:Request) => {
  const origin = request.headers.get("Origin") ?? "";
  if (request.method==="OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return json(request,{error:"origin_not_allowed"},403);
    return new Response(null,{status:204,headers:headersFor(request)});
  }
  if (request.method!=="POST") return json(request,{error:"method_not_allowed"},405);

  const apiKey = request.headers.get("apikey") ?? "";
  if (!allowedPublishableKeys().has(apiKey)) return json(request,{error:"unauthorized"},401);
  const token = (request.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(request,{error:"authentication_required"},401);

  try {
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!,apiKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const {data:authData,error:authError}=await authClient.auth.getUser(token);
    if (authError || !authData.user) return json(request,{error:"unauthorized"},401);
    if (!authData.user.email_confirmed_at) return json(request,{error:"email_verification_required"},403);

    const body = await request.json().catch(()=>null) as Record<string,unknown>|null;
    const orderCode = typeof body?.orderCode==="string" ? body.orderCode.trim().toUpperCase() : "";
    const mobile = typeof body?.mobile==="string" ? digits(body.mobile) : "";
    if (!/^NB-[A-Z0-9-]{6,24}$/.test(orderCode) || !/^09\d{9}$/.test(mobile)) {
      return json(request,{error:"invalid_claim_details"},400);
    }

    const db=serviceClient();
    const {data:allowed,error:limitError}=await db.rpc("record_order_claim_attempt",{p_user_id:authData.user.id});
    if (limitError) throw new Error("rate_limit_check_failed");
    if (allowed!==true) return json(request,{error:"claim_rate_limited"},429);

    const {data:claimed,error:claimError}=await db.from("orders")
      .update({user_id:authData.user.id})
      .eq("order_code",orderCode).eq("mobile",mobile).is("user_id",null)
      .select("id").maybeSingle();
    if (claimError) throw new Error("claim_failed");
    if (claimed) return json(request,{claimed:true});

    const {data:existing,error:existingError}=await db.from("orders")
      .select("id").eq("order_code",orderCode).eq("mobile",mobile)
      .eq("user_id",authData.user.id).maybeSingle();
    if (existingError) throw new Error("claim_failed");
    if (existing) return json(request,{claimed:true});
    return json(request,{error:"order_not_found"},404);
  } catch (error) {
    console.error("claim-order failed",error instanceof Error?error.message:"unknown");
    return json(request,{error:"claim_failed"},500);
  }
});
