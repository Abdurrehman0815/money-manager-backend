const Account = require('../models/Account');

// @desc    Get all accounts for the logged-in user
// @route   GET /api/accounts
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user.id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAccounts };