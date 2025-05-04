const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['earn', 'spend']
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'content_view',
      'content_save',
      'content_share',
      'premium_content',
      'event_registration',
      'other'
    ]
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1, createdAt: -1 });

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = CreditTransaction; 