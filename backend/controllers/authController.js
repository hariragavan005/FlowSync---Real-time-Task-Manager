const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Register ──────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  // Note: role is intentionally NOT taken from req.body.
  // All new users start as Member. Roles can only be upgraded by an Admin.
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role: 'Member' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, avatarUrl: user.avatarUrl,
      token: generateToken(user._id)
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, avatarUrl: user.avatarUrl,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Update Profile (name, email, avatarUrl) ───────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl;
    if (req.body.email && req.body.email !== user.email) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = req.body.email;
    }

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Change Password ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Get My Profile ────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { registerUser, loginUser, updateProfile, changePassword, getProfile };
