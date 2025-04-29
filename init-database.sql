-- Initial database setup for Kitoko application

-- Check and create account_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE public.account_type AS ENUM ('Client', 'Employee', 'Admin');
  END IF;
END$$;

-- Create account table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.account (
    account_id SERIAL PRIMARY KEY,
    account_firstname VARCHAR(50) NOT NULL,
    account_lastname VARCHAR(50) NOT NULL,
    account_email VARCHAR(100) NOT NULL UNIQUE,
    account_password VARCHAR(255) NOT NULL,
    account_phone VARCHAR(15),
    account_type account_type NOT NULL DEFAULT 'Client'::account_type,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create service categories table
CREATE TABLE IF NOT EXISTS public.service_category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    category_description TEXT,
    category_image VARCHAR(255)
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.service (
    service_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.service_category(category_id),
    service_name VARCHAR(100) NOT NULL,
    service_description TEXT NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL,
    service_image VARCHAR(255),
    service_thumbnail VARCHAR(255),
    min_guests INTEGER DEFAULT 0,
    max_guests INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories if they don't exist
INSERT INTO public.service_category (category_name, category_description, category_image) 
SELECT 'Wedding Decoration', 'Beautiful decoration services for your special day', '/images/categories/wedding-decor.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Wedding Decoration');

INSERT INTO public.service_category (category_name, category_description, category_image) 
SELECT 'Corporate Events', 'Professional decoration for corporate gatherings', '/images/categories/corporate-events.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Corporate Events');

INSERT INTO public.service_category (category_name, category_description, category_image) 
SELECT 'Catering Services', 'Delicious food options for all types of events', '/images/categories/catering.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Catering Services');

-- Insert sample services if they don't exist
INSERT INTO public.service (category_id, service_name, service_description, service_price, service_image, service_thumbnail, min_guests, max_guests)
SELECT 
    (SELECT category_id FROM public.service_category WHERE category_name = 'Wedding Decoration'),
    'Premium Wedding Package',
    'Our premium wedding decoration package includes elegant tablescapes, floral arrangements, lighting, and custom backdrop for your ceremony and reception.',
    1999.99,
    '/images/services/wedding-premium.jpg',
    '/images/services/wedding-premium-tn.jpg',
    50,
    200
WHERE NOT EXISTS (SELECT 1 FROM public.service WHERE service_name = 'Premium Wedding Package');

INSERT INTO public.service (category_id, service_name, service_description, service_price, service_image, service_thumbnail, min_guests, max_guests)
SELECT 
    (SELECT category_id FROM public.service_category WHERE category_name = 'Corporate Events'),
    'Executive Conference Setup',
    'Professional setup for corporate conferences including stage decoration, branded backdrops, seating arrangements, and technological support.',
    1499.99,
    '/images/services/corporate-conference.jpg',
    '/images/services/corporate-conference-tn.jpg',
    20,
    100
WHERE NOT EXISTS (SELECT 1 FROM public.service WHERE service_name = 'Executive Conference Setup');