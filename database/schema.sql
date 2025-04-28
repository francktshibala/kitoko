-- Create account types enum
CREATE TYPE public.account_type AS ENUM ('Client', 'Employee', 'Admin');

-- Create account table
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

-- Create service categories table (replaces classifications)
CREATE TABLE IF NOT EXISTS public.service_category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    category_description TEXT,
    category_image VARCHAR(255)
);

-- Create services table (replaces inventory)
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

-- Create service options table (for additional choices)
CREATE TABLE IF NOT EXISTS public.service_option (
    option_id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES public.service(service_id) ON DELETE CASCADE,
    option_name VARCHAR(100) NOT NULL,
    option_description TEXT,
    option_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.review (
    review_id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES public.service(service_id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES public.account(account_id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    review_rating INTEGER NOT NULL CHECK (review_rating BETWEEN 1 AND 5),
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.booking (
    booking_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES public.account(account_id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_start_time TIME NOT NULL,
    event_end_time TIME NOT NULL,
    event_location TEXT,
    guest_count INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create booking_services junction table
CREATE TABLE IF NOT EXISTS public.booking_service (
    booking_service_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES public.booking(booking_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES public.service(service_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_booking NUMERIC(10, 2) NOT NULL
);

-- Create booking_options junction table
CREATE TABLE IF NOT EXISTS public.booking_option (
    booking_option_id SERIAL PRIMARY KEY,
    booking_service_id INTEGER REFERENCES public.booking_service(booking_service_id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES public.service_option(option_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_booking NUMERIC(10, 2) NOT NULL
);

-- Create gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
    gallery_id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES public.service(service_id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    image_title VARCHAR(100),
    image_description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message table for customer inquiries
CREATE TABLE IF NOT EXISTS public.message (
    message_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES public.account(account_id) ON DELETE SET NULL,
    guest_name VARCHAR(100),
    guest_email VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(15),
    message_subject VARCHAR(100) NOT NULL,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin account
INSERT INTO public.account (
    account_firstname, 
    account_lastname, 
    account_email, 
    account_password,
    account_type
) VALUES (
    'Admin',
    'User',
    'admin@eventelegance.com',
    '$2a$10$ZQSiGtOuD1fwJ7GpLFVWuOsVh8Xv.Y3TDdCO6sSgTrOUmIfiomivy', -- Password: Admin123!
    'Admin'
);

-- Insert sample service categories
INSERT INTO public.service_category (category_name, category_description, category_image) VALUES
('Wedding Decoration', 'Beautiful decoration services for your special day', '/images/categories/wedding-decor.jpg'),
('Corporate Events', 'Professional decoration for corporate gatherings', '/images/categories/corporate-events.jpg'),
('Catering Services', 'Delicious food options for all types of events', '/images/categories/catering.jpg'),
('Birthday Parties', 'Make your birthday celebration special', '/images/categories/birthday.jpg'),
('Anniversary Celebrations', 'Romantic settings for anniversary milestones', '/images/categories/anniversary.jpg');