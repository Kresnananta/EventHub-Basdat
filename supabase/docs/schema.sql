-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  category_id integer,
  title text NOT NULL,
  description text,
  banner_url text,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'cancelled'::text, 'completed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  venue_id uuid NOT NULL,
  slug text UNIQUE,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.profiles(id),
  CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  event_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'IDR'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'refunded'::text])),
  payment_method text,
  payment_ref text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  seat_id uuid,
  expires_at timestamp with time zone DEFAULT (now() + '00:30:00'::interval),
  ticket_id uuid DEFAULT gen_random_uuid(),
  ticket_code text DEFAULT upper(SUBSTRING((gen_random_uuid())::text FROM 1 FOR 8)) UNIQUE,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT orders_management_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  role text NOT NULL DEFAULT 'buyer'::text CHECK (role = ANY (ARRAY['buyer'::text, 'organizer'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.seats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid,
  seat_number text NOT NULL,
  is_available boolean DEFAULT true,
  CONSTRAINT seats_pkey PRIMARY KEY (id),
  CONSTRAINT seats_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id)
);
CREATE TABLE public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  name text NOT NULL,
  price numeric NOT NULL,
  capacity integer NOT NULL,
  is_seated boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sections_pkey PRIMARY KEY (id),
  CONSTRAINT sections_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.ticket_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR'::text,
  quantity integer NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ticket_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_tiers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  tier_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  ticket_code text NOT NULL DEFAULT upper(SUBSTRING((gen_random_uuid())::text FROM 1 FOR 8)) UNIQUE,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'used'::text, 'cancelled'::text, 'refunded'::text])),
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT tickets_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.ticket_tiers(id),
  CONSTRAINT tickets_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  capacity integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);
