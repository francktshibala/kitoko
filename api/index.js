const express = require('express');
const router = express.Router();

// Import route modules
const accountRoutes = require('./routes/account-routes');
const serviceRoutes = require('./routes/service-routes');
const reviewRoutes = require('./routes/review-routes');
const bookingRoutes = require('./routes/booking-routes');
const galleryRoutes = require('./routes/gallery-routes');
const messageRoutes = require('./routes/message-routes');

// Set up API routes
router.use('/account', accountRoutes);
router.use('/services', serviceRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/gallery', galleryRoutes);
router.use('/messages', messageRoutes);

// API health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

module.exports = router;