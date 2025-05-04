const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Content = require('../models/Content');

// Get user's credit points
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ creditPoints: user.creditPoints });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get credit transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await CreditTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('content');

    const total = await CreditTransaction.countDocuments({ user: req.user._id });

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Spend credits on premium content
router.post('/spend', auth, async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!content.isPremium) {
      return res.status(400).json({ message: 'Content is not premium' });
    }

    const user = await User.findById(req.user._id);
    if (user.creditPoints < content.creditPoints) {
      return res.status(400).json({ message: 'Insufficient credit points' });
    }

    // Create transaction
    const transaction = new CreditTransaction({
      user: user._id,
      amount: content.creditPoints,
      type: 'spend',
      purpose: 'premium_content',
      content: content._id
    });
    await transaction.save();

    // Update user's credit points
    user.creditPoints -= content.creditPoints;
    await user.save();

    res.json({
      message: 'Premium content unlocked successfully',
      remainingCredits: user.creditPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Earn credits by viewing content
router.post('/earn/view', auth, async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user already earned points for this content
    const existingTransaction = await CreditTransaction.findOne({
      user: req.user._id,
      content: content._id,
      purpose: 'content_view'
    });

    if (existingTransaction) {
      return res.status(400).json({ message: 'Points already earned for this content' });
    }

    // Create transaction
    const transaction = new CreditTransaction({
      user: req.user._id,
      amount: 2, // Points for viewing content
      type: 'earn',
      purpose: 'content_view',
      content: content._id
    });
    await transaction.save();

    // Update user's credit points
    const user = await User.findById(req.user._id);
    user.creditPoints += 2;
    await user.save();

    res.json({
      message: 'Points earned successfully',
      earnedPoints: 2,
      totalPoints: user.creditPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 