const express = require('express');
const router = express.Router();
const { adminAuth, moderatorAuth } = require('../middleware/auth');
const User = require('../models/User');
const Content = require('../models/Content');
const CreditTransaction = require('../models/CreditTransaction');

// Get reported content
router.get('/reports', moderatorAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const content = await Content.find({ 'reports.0': { $exists: true } })
      .sort({ 'reports.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .populate('reports.user', 'username email');

    const total = await Content.countDocuments({ 'reports.0': { $exists: true } });

    res.json({
      content,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle reported content
router.post('/reports/:contentId/handle', moderatorAuth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!['remove', 'keep'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const content = await Content.findById(req.params.contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (action === 'remove') {
      await Content.findByIdAndDelete(req.params.contentId);
      res.json({ message: 'Content removed successfully' });
    } else {
      content.reports = [];
      await content.save();
      res.json({ message: 'Content kept, reports cleared' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
router.get('/stats/users', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ creditPoints: { $gt: 0 } });
    const topUsers = await User.find()
      .sort({ creditPoints: -1 })
      .limit(10)
      .select('username email creditPoints');

    res.json({
      totalUsers,
      activeUsers,
      topUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content statistics
router.get('/stats/content', adminAuth, async (req, res) => {
  try {
    const totalContent = await Content.countDocuments();
    const premiumContent = await Content.countDocuments({ isPremium: true });
    const topSaved = await Content.find()
      .sort({ savedBy: -1 })
      .limit(10)
      .select('title source savedBy');

    res.json({
      totalContent,
      premiumContent,
      topSaved
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage user roles
router.put('/users/:userId/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage premium content
router.put('/content/:contentId/premium', adminAuth, async (req, res) => {
  try {
    const { isPremium, creditPoints } = req.body;

    const content = await Content.findByIdAndUpdate(
      req.params.contentId,
      { isPremium, creditPoints },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
