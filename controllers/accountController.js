const Account = require('../models/Account');

// @desc    Get all accounts for the logged-in user (seed defaults if none)
// @route   GET /api/transactions/accounts
const getAccounts = async (req, res) => {
  try {
    let accounts = await Account.find({ user: req.user.id });

    if (!accounts || accounts.length === 0) {
      const defaults = [
        { user: req.user.id, name: 'Cash', type: 'Cash', balance: 0 },
        { user: req.user.id, name: 'Bank', type: 'Bank', balance: 0 }
      ];
      accounts = await Account.insertMany(defaults);
    }

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAccounts };
