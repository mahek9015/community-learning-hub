const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Content = require('../models/Content');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

// Get feed content with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const content = await Content.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Content.countDocuments();

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

// Save content for later
router.post('/:contentId/save', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.savedContent.includes(content._id)) {
      return res.status(400).json({ message: 'Content already saved' });
    }

    user.savedContent.push(content._id);
    await user.save();

    // Add credit points for saving content
    const transaction = new CreditTransaction({
      user: user._id,
      amount: 5,
      type: 'earn',
      purpose: 'content_save',
      content: content._id
    });
    await transaction.save();

    user.creditPoints += 5;
    await user.save();

    res.json({ message: 'Content saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Report content
router.post('/:contentId/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const content = await Content.findById(req.params.contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.reports.push({
      user: req.user._id,
      reason
    });
    await content.save();

    res.json({ message: 'Content reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved content
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedContent');
    res.json(user.savedContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search content
router.get('/search', auth, async (req, res) => {
  try {
    const { query, category, source } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchQuery = {};
    
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (source) {
      searchQuery.source = source;
    }

    const content = await Content.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Content.countDocuments(searchQuery);

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

module.exports = router; 