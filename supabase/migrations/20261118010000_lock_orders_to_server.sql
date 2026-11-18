-- Keep order records inaccessible to browser roles.
-- Server functions use the service-role client only after validating the admin JWT and email.
revoke all on table public.orders from anon, authenticated;
