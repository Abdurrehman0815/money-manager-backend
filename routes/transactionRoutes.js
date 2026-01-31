const express = require('express');
const router = express.Router();
const { addTransaction, getTransactions, editTransaction, deleteTransaction } = require('../controllers/transactionController');
const { getAccounts } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

// Account Routes
router.get('/accounts', protect, getAccounts);

// Transaction Routes
router.post('/add', protect, addTransaction);
router.get('/', protect, getTransactions);
router.put('/:id', protect, editTransaction);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;