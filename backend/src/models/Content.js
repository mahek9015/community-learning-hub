const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['twitter', 'reddit', 'linkedin']
  },
  sourceUrl: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  authorUrl: {
    type: String
  },
  thumbnail: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['education', 'technology', 'science', 'business', 'other']
  },
  creditPoints: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
contentSchema.index({ title: 'text', description: 'text' });
contentSchema.index({ source: 1, createdAt: -1 });
contentSchema.index({ category: 1, createdAt: -1 });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content; 
