const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/serviceController');
const utilities = require('../../utilities');

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await serviceController.getAllServices();
    
    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services'
    });
  }
});

// Get service by id
router.get('/:serviceId', async (req, res) => {
  try {
    const service = await serviceController.getServiceById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching service'
    });
  }
});

// Get services by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const services = await serviceController.getServicesByCategoryId(req.params.categoryId);
    
    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services by category'
    });
  }
});

module.exports = router;