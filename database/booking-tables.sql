-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking (
    booking_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES public.account(account_id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_start_time TIME NOT NULL,
    event_end_time TIME NOT NULL,
    event_location TEXT NOT NULL,
    guest_count INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create booking_services junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_service (
    booking_service_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES public.booking(booking_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES public.service(service_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_booking NUMERIC(10, 2) NOT NULL
);

-- Create booking_options junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_option (
    booking_option_id SERIAL PRIMARY KEY,
    booking_service_id INTEGER REFERENCES public.booking_service(booking_service_id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES public.service_option(option_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_booking NUMERIC(10, 2) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_account_id ON public.booking(account_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON public.booking(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_event_date ON public.booking(event_date);
CREATE INDEX IF NOT EXISTS idx_booking_service_booking_id ON public.booking_service(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_service_service_id ON public.booking_service(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_option_booking_service_id ON public.booking_option(booking_service_id);
CREATE INDEX IF NOT EXISTS idx_booking_option_option_id ON public.booking_option(option_id);

-- Create message table
CREATE TABLE IF NOT EXISTS public.message (
    message_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES public.account(account_id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES public.message(message_id) ON DELETE SET NULL,
    guest_name VARCHAR(100),
    guest_email VARCHAR(100),
    guest_phone VARCHAR(15),
    message_subject VARCHAR(100) NOT NULL,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_account_id ON public.message(account_id);
CREATE INDEX IF NOT EXISTS idx_message_parent_id ON public.message(parent_id);
CREATE INDEX IF NOT EXISTS idx_message_is_read ON public.message(is_read);