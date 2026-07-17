const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 1. PUBLIC: GET /api/payments/invoice/:orderId (Retrieve details for generating invoice)
router.get('/invoice/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return res.status(404).json({ error: 'Invoice details not found.' });

    const plan = await prisma.pricingPlan.findUnique({ where: { id: payment.planId } });
    const admin = await prisma.admin.findFirst();
    return res.json({
      coachName: `${admin?.firstName || 'Sonu'} ${admin?.lastName || 'Ambre'}`,
      coachEmail: admin?.email || 'sonu@apexcoaching.in',
      coachPhone: admin?.whatsapp || '+91 98765 43210',
      gstNumber: admin?.gstNumber || '',
      payment,
      planName: plan ? plan.name : 'Fitness Coaching',
      planPrice: plan ? plan.price : payment.amount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
