const User = require('../models/User');
const Account = require('../models/Account'); // We need this to create default accounts
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the User
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      // 4. AUTOMATICALLY create default accounts (Cash & Bank) for the new user
      await Account.create([
        { user: user._id, name: 'Cash', type: 'Cash', balance: 0 },
        { user: user._id, name: 'Bank Account', type: 'Bank', balance: 0 }
      ]);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id), // Send the token right away
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check for user email
    const user = await User.findOne({ email });

    // 2. Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };