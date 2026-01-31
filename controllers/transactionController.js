const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');

// @desc    Add Transaction
// @route   POST /api/transactions
const addTransaction = async (req, res) => {
  const { type, amount, category, division, description, date, accountFrom, accountTo, recipientEmail } = req.body;

  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // --- 1. INCOME VALIDATION ---
    if (type === 'income') {
      const accounts = await Account.find({ user: req.user.id });
      const totalRealBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

      const incomeResult = await Transaction.aggregate([
        { $match: { user: userId, type: 'income' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const currentTotalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

      if ((currentTotalIncome + Number(amount)) > totalRealBalance) {
        return res.status(400).json({ 
          message: `Income Mismatch! Your Real Balance is ₹${totalRealBalance}. You cannot record Income (₹${currentTotalIncome + Number(amount)}) higher than your actual money.` 
        });
      }
    }

    // --- 2. EXPENSE BUDGET CHECK ---
    if (type === 'expense' || type === 'p2p') {
      const incomeResult = await Transaction.aggregate([
        { $match: { user: userId, type: 'income' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

      const expenseResult = await Transaction.aggregate([
        { $match: { user: userId, type: { $in: ['expense', 'p2p'] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const currentTotalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;

      const remainingBudget = totalIncome - currentTotalExpense;
      
      if (Number(amount) > remainingBudget) {
        return res.status(400).json({ 
          message: `Budget Exceeded! You only have ₹${remainingBudget} remaining from your Total Income.` 
        });
      }
    }

    // --- 3. ACCOUNT BALANCE CHECK ---
    if (type === 'expense' || type === 'transfer' || type === 'p2p') {
      const sourceAccount = await Account.findById(accountFrom);
      
      if (!sourceAccount) {
        return res.status(404).json({ message: 'Please select a valid "Pay From" account.' });
      }

      if (sourceAccount.balance < amount) {
        return res.status(400).json({ 
          message: `Insufficient funds in ${sourceAccount.name}! Balance: ₹${sourceAccount.balance}` 
        });
      }
    }

    // --- 4. EXECUTE TRANSACTIONS ---

    // A. DEPOSIT
    if (type === 'deposit') {
      const account = await Account.findById(accountTo);
      if (!account) return res.status(404).json({ message: 'Target account not found' });

      account.balance += Number(amount);
      await account.save();

      const transaction = await Transaction.create({
        user: req.user.id,
        type: 'deposit',
        amount,
        category: 'Deposit',
        division: 'Personal',
        description: description || 'Money Added',
        date,
        accountTo
      });
      return res.status(201).json(transaction);
    }

    // B. P2P TRANSFER
    if (type === 'p2p') {
      const recipientUser = await User.findOne({ email: recipientEmail });
      if (!recipientUser) return res.status(404).json({ message: 'User not found' });

      const recipientAccount = await Account.findOne({ user: recipientUser._id, type: 'Bank' });
      if (!recipientAccount) return res.status(400).json({ message: 'Recipient needs a Bank Account' });

      const myAcc = await Account.findById(accountFrom);
      myAcc.balance -= Number(amount); 
      await myAcc.save();

      recipientAccount.balance += Number(amount); 
      await recipientAccount.save();

      const trans = await Transaction.create({
        user: req.user.id,
        type: 'expense',
        amount,
        category: 'Transfer',
        description: `Sent to ${recipientUser.username} (${recipientEmail})`,
        division: 'Personal',
        date,
        accountFrom
      });

      await Transaction.create({
        user: recipientUser._id,
        type: 'deposit', 
        amount,
        category: 'Transfer',
        description: `Received from ${req.user.username}`,
        division: 'Personal',
        date,
        accountTo: recipientAccount._id
      });

      return res.status(201).json(trans);
    }

    // C. TRANSFER
    if (type === 'transfer') {
        const fromAcc = await Account.findById(accountFrom);
        const toAcc = await Account.findById(accountTo);

        if (String(fromAcc._id) === String(toAcc._id)) {
            return res.status(400).json({ message: "Cannot transfer to the same account." });
        }

        fromAcc.balance -= Number(amount);
        toAcc.balance += Number(amount);
        
        await fromAcc.save();
        await toAcc.save();

        const transaction = await Transaction.create({
            user: req.user.id,
            type: 'transfer',
            amount,
            category: 'Transfer',
            division,
            description: description || `Transfer: ${fromAcc.name} to ${toAcc.name}`,
            date,
            accountFrom,
            accountTo
        });
        return res.status(201).json(transaction);
    }

    // D. INCOME
    if (type === 'income') {
        const transaction = await Transaction.create({
            user: req.user.id,
            type: 'income',
            amount,
            category,
            division,
            description,
            date
        });
        return res.status(201).json(transaction);
    }

    // E. EXPENSE
    if (type === 'expense') {
      const acc = await Account.findById(accountFrom);
      acc.balance -= Number(amount);
      await acc.save();

      const transaction = await Transaction.create({
        user: req.user.id,
        type: 'expense',
        amount,
        category,
        division,
        description,
        date,
        accountFrom
      });
      return res.status(201).json(transaction);
    }

  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Transactions
const getTransactions = async (req, res) => {
  try {
    const { type, division, category, startDate, endDate } = req.query;
    let filter = { user: req.user.id };

    if (type && type !== 'all') filter.type = type;
    if (division) filter.division = division;
    if (category) filter.category = category;

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .populate('accountFrom', 'name')
      .populate('accountTo', 'name');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Accounts
const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ user: req.user.id });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit Transaction
const editTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // 1. Check 12-Hour Rule
    const hoursDiff = (Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 12) return res.status(403).json({ message: 'Cannot edit after 12 hours' });

    const { amount, category, division, description, date } = req.body;
    const oldAmount = transaction.amount;
    const newAmount = Number(amount);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 2. Handle Amount Changes & Validations
    if (newAmount !== oldAmount) {
        
        // A. If Editing INCOME
        if (transaction.type === 'income') {
            const accounts = await Account.find({ user: req.user.id });
            const totalRealBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

            const incomeResult = await Transaction.aggregate([
                { $match: { user: userId, type: 'income' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const currentTotalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
            
            // Check: (Total Income - Old + New) > Balance?
            if ((currentTotalIncome - oldAmount + newAmount) > totalRealBalance) {
                return res.status(400).json({ message: "Cannot edit Income: Result exceeds your actual balance." });
            }
        } 
        
        // B. If Editing EXPENSE
        else if (transaction.type === 'expense') {
            // Check 1: Budget
            const incomeResult = await Transaction.aggregate([
                { $match: { user: userId, type: 'income' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

            const expenseResult = await Transaction.aggregate([
                { $match: { user: userId, type: { $in: ['expense', 'p2p'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const currentTotalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;

            // Check: (Total Expense - Old + New) > Total Income?
            if ((currentTotalExpense - oldAmount + newAmount) > totalIncome) {
                return res.status(400).json({ message: "Cannot edit Expense: Budget exceeded." });
            }

            // Check 2: Account Balance
            const acc = await Account.findById(transaction.accountFrom);
            // Refund old amount, check if enough for new amount
            if ((acc.balance + oldAmount) < newAmount) {
                return res.status(400).json({ message: "Insufficient funds in account for this new amount." });
            }

            // Update Account Balance
            acc.balance = acc.balance + oldAmount - newAmount;
            await acc.save();
        } 
        // Other types (Transfer/Deposit) amounts are locked in frontend, but good to block here too if needed
    }

    // 3. Update Fields
    transaction.amount = newAmount;
    transaction.category = category || transaction.category;
    transaction.division = division || transaction.division;
    transaction.description = description || transaction.description;
    transaction.date = date || transaction.date;

    await transaction.save();
    res.json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Not found' });

    const hoursDiff = (Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 12) return res.status(403).json({ message: 'Cannot delete after 12 hours' });

    if (transaction.type === 'deposit') {
      const acc = await Account.findById(transaction.accountTo);
      if(acc) { acc.balance -= transaction.amount; await acc.save(); }
    } else if (transaction.type === 'expense') {
      const acc = await Account.findById(transaction.accountFrom);
      if(acc) { acc.balance += transaction.amount; await acc.save(); }
    } else if (transaction.type === 'transfer') {
        const fromAcc = await Account.findById(transaction.accountFrom);
        const toAcc = await Account.findById(transaction.accountTo);
        if(fromAcc && toAcc) {
            fromAcc.balance += transaction.amount;
            toAcc.balance -= transaction.amount;
            await fromAcc.save();
            await toAcc.save();
        }
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addTransaction, getTransactions, getAccounts, editTransaction, deleteTransaction };