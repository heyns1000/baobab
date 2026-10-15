// Enhanced API Backend for FAA Ecosystem
// Extends the existing seedwave api/index.js

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const router = express.Router();

// Import FAA configuration
const faaConfig = require('../config/faa-master-config.json');

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: faaConfig.faa.version,
    trunk_locked: faaConfig.baobab.immutable,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/sectors
 * Get all 31 sectors
 */
router.get('/sectors', (req, res) => {
  res.json({
    success: true,
    count: Object.keys(faaConfig.sectors).length,
    sectors: faaConfig.sectors
  });
});

/**
 * GET /api/sectors/:id
 * Get specific sector details
 */
router.get('/sectors/:id', (req, res) => {
  const sector = faaConfig.sectors[req.params.id];

  if (!sector) {
    return res.status(404).json({
      success: false,
      error: 'Sector not found'
    });
  }

  res.json({
    success: true,
    sector
  });
});

/**
 * POST /api/wallet/process-payment
 * Process a payment and trigger scroll/license generation
 */
router.post('/wallet/process-payment', async (req, res) => {
  try {
    const payment = req.body;

    // Validate required fields
    const required = ['amount', 'currency', 'paymentMethod', 'sectorId', 'customerEmail'];
    for (const field of required) {
      if (!payment[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Process payment (would integrate with actual payment providers)
    const result = {
      success: true,
      transaction_id: generateTransactionId(),
      payment_id: generatePaymentId(),
      scroll_id: generateScrollId(),
      license_key: generateLicenseKey(),
      amount: payment.amount,
      currency: payment.currency,
      sector: payment.sectorId,
      customer_email: payment.customerEmail,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scrolls/generate
 * Generate a legal scroll for a sector subscription
 */
router.post('/scrolls/generate', async (req, res) => {
  try {
    const { sectorId, customerEmail, paymentId } = req.body;

    const sector = faaConfig.sectors[sectorId];
    if (!sector) {
      return res.status(404).json({
        success: false,
        error: 'Sector not found'
      });
    }

    const scroll = {
      id: generateScrollId(),
      template: sector.scroll_template,
      sector_id: sectorId,
      sector_name: sector.name,
      customer_email: customerEmail,
      payment_id: paymentId,
      generated_at: new Date().toISOString(),
      legal_frameworks: ['FAA', 'ECTA', 'GDPR'],
      status: 'generated',
      binding: true
    };

    res.json({
      success: true,
      scroll
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/licenses/generate
 * Generate a license from a scroll
 */
router.post('/licenses/generate', async (req, res) => {
  try {
    const { scrollId, licenseType, billingCycle } = req.body;

    const licenseConfig = faaConfig.licenses[licenseType] || faaConfig.licenses.seadwave;

    const license = {
      key: generateLicenseKey(),
      type: licenseType,
      name: licenseConfig.name,
      scroll_id: scrollId,
      issued_at: new Date().toISOString(),
      expires_at: calculateExpiryDate(billingCycle),
      includes: licenseConfig.includes,
      status: 'active',
      binding: 'FAA-ECTA-GDPR'
    };

    res.json({
      success: true,
      license
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/nodes/status
 * Get node network status
 */
router.get('/nodes/status', (req, res) => {
  res.json({
    success: true,
    total_nodes: faaConfig.baobab.node_count,
    pulse_interval_seconds: faaConfig.baobab.pulse_interval_seconds,
    lions: faaConfig.baobab.lions,
    giraffe_vision_km: faaConfig.baobab.giraffe_vision_km,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/wallet/info
 * Get wallet information
 */
router.get('/wallet/info', (req, res) => {
  res.json({
    success: true,
    wallet: {
      wallet_id: faaConfig.wallet.primary.wallet_id,
      node_link: faaConfig.wallet.primary.node_link,
      supported_assets: faaConfig.wallet.supported_assets,
      fiat_providers: faaConfig.wallet.fiat_providers
    }
  });
});

/**
 * POST /api/paypal/create-subscription
 * Create PayPal subscription (integrates with existing PayPal logic)
 */
router.post('/paypal/create-subscription', async (req, res) => {
  try {
    const { planId, customerEmail, sectorId } = req.body;

    // This would call actual PayPal SDK
    // For now, return simulated response

    const subscription = {
      subscription_id: generateSubscriptionId(),
      plan_id: planId,
      sector_id: sectorId,
      customer_email: customerEmail,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateTransactionId() {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generatePaymentId() {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateScrollId() {
  return `SCROLL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateLicenseKey() {
  return `LIC-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function generateSubscriptionId() {
  return `SUB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function calculateExpiryDate(billingCycle) {
  const now = new Date();
  if (billingCycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

module.exports = router;
