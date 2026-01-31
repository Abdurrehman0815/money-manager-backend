const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g., "HDFC Bank", "Cash", "Wallet"
  type: { type: String, enum: ['Bank', 'Cash', 'Wallet', 'Other'], default: 'Cash' },
  balance: { type: Number, default: 0, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);