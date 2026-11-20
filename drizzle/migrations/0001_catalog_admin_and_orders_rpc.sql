-- ---------- Roles ----------
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ---------- Products (base columns match the owner's existing products table) ----------
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  name jsonb NOT NULL DEFAULT '{"fa":"","en":""}'::jsonb,
  price bigint NOT NULL CHECK (price > 0),
  old_price bigint CHECK (old_price IS NULL OR old_price > 0),
  category text NOT NULL,
  short jsonb NOT NULL DEFAULT '{"fa":"","en":""}'::jsonb,
  description jsonb NOT NULL DEFAULT '{"fa":"","en":""}'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS products_active_sort_idx ON public.products (active, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can add products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can edit products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- Orders: admin read + status-only update ----------
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE (status) ON public.orders TO authenticated;
CREATE POLICY "Admins can view orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update order status" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- Checkout: validate, re-price from active products, save ----------
CREATE OR REPLACE FUNCTION public.place_order(_customer jsonb, _items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(_customer->>'name', ''));
  v_mobile text := coalesce(_customer->>'mobile', '');
  v_province text := btrim(coalesce(_customer->>'province', ''));
  v_city text := btrim(coalesce(_customer->>'city', ''));
  v_address text := btrim(coalesce(_customer->>'address', ''));
  v_postal text := coalesce(_customer->>'postalCode', '');
  v_notes text := btrim(coalesce(_customer->>'notes', ''));
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty_num numeric;
  v_qty integer;
  v_opt jsonb;
  v_chosen text;
  v_match text;
  v_opts jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_total bigint := 0;
  v_code text;
  v_attempt integer;
BEGIN
  IF jsonb_typeof(_customer) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'invalid_customer';
  END IF;
  v_mobile := regexp_replace(translate(v_mobile, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[[:space:]-]', '', 'g');
  v_postal := regexp_replace(translate(v_postal, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[[:space:]-]', '', 'g');

  IF char_length(v_name) < 2 OR char_length(v_name) > 80
     OR v_mobile !~ '^09[0-9]{9}$'
     OR v_province <> ALL (ARRAY['آذربایجان شرقی','آذربایجان غربی','اردبیل','اصفهان','البرز','ایلام','بوشهر','تهران',
       'چهارمحال و بختیاری','خراسان جنوبی','خراسان رضوی','خراسان شمالی','خوزستان','زنجان','سمنان',
       'سیستان و بلوچستان','فارس','قزوین','قم','کردستان','کرمان','کرمانشاه','کهگیلویه و بویراحمد',
       'گلستان','گیلان','لرستان','مازندران','مرکزی','هرمزگان','همدان','یزد'])
     OR char_length(v_city) < 2 OR char_length(v_city) > 60
     OR char_length(v_address) < 10 OR char_length(v_address) > 400
     OR v_postal !~ '^[0-9]{10}$'
     OR char_length(v_notes) > 500 THEN
    RAISE EXCEPTION 'invalid_customer';
  END IF;

  IF jsonb_typeof(_items) IS DISTINCT FROM 'array' OR jsonb_array_length(_items) < 1 OR jsonb_array_length(_items) > 30 THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' OR jsonb_typeof(v_item->'qty') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'invalid_items';
    END IF;
    v_qty_num := (v_item->>'qty')::numeric;
    IF v_qty_num <> trunc(v_qty_num) OR v_qty_num < 1 OR v_qty_num > 20 THEN
      RAISE EXCEPTION 'invalid_items';
    END IF;
    v_qty := v_qty_num::integer;

    SELECT * INTO v_product FROM public.products
      WHERE id = v_item->>'id' AND active = true AND in_stock = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'unavailable_product';
    END IF;

    v_opts := '{}'::jsonb;
    FOR v_opt IN SELECT value FROM jsonb_array_elements(coalesce(v_product.options, '[]'::jsonb)) LOOP
      v_chosen := CASE WHEN jsonb_typeof(v_item->'options') = 'object' THEN v_item->'options'->>(v_opt->>'type') END;
      v_match := NULL;
      IF v_chosen IS NOT NULL THEN
        SELECT val->>'fa' INTO v_match FROM jsonb_array_elements(coalesce(v_opt->'values', '[]'::jsonb)) AS val
          WHERE val->>'fa' = v_chosen LIMIT 1;
        IF v_match IS NULL THEN
          RAISE EXCEPTION 'invalid_option';
        END IF;
      ELSE
        v_match := v_opt->'values'->0->>'fa';
      END IF;
      IF v_match IS NOT NULL THEN
        v_opts := v_opts || jsonb_build_object(v_opt->>'type', v_match);
      END IF;
    END LOOP;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'nameFa', coalesce(v_product.name->>'fa', v_product.id),
      'qty', v_qty,
      'options', v_opts,
      'unitPrice', v_product.price,
      'lineTotal', v_product.price * v_qty
    ));
    v_total := v_total + v_product.price * v_qty;
  END LOOP;

  FOR v_attempt IN 1..5 LOOP
    v_code := 'NB-' || lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    BEGIN
      INSERT INTO public.orders (order_code, customer_name, mobile, province, city, address, postal_code, notes, items, total_toman)
      VALUES (v_code, v_name, v_mobile, v_province, v_city, v_address, v_postal, v_notes, v_lines, v_total);
      RETURN jsonb_build_object('code', v_code, 'lines', v_lines, 'total', v_total);
    EXCEPTION WHEN unique_violation THEN
      -- order code collision: try another code
    END;
  END LOOP;
  RAISE EXCEPTION 'save_failed';
END
$$;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated, service_role;