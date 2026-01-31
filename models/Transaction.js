const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer', 'deposit', 'p2p'], 
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive amount'],
  },
  category: {
    type: String,
    required: false, // Made optional for types that don't need it
  },
  division: {
    type: String,
    enum: ['Personal', 'Office'],
    default: 'Personal',
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // ACCOUNTS: Not required for every type now (e.g., Income)
  accountFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false, 
  },
  accountTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);