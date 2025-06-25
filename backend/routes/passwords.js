const express = require('express');
const CryptoJS = require('crypto-js');
const Password = require('../models/Password');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all passwords
router.get('/', auth, async (req, res) => {
  try {
    const passwords = await Password.find({ userId: req.userId });
    const user = await User.findById(req.userId);
    
    // Decrypt passwords
    const decryptedPasswords = passwords.map(pwd => {
      const decryptedPassword = CryptoJS.AES.decrypt(
        pwd.encryptedPassword, 
        user.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      
      return {
        ...pwd.toObject(),
        password: decryptedPassword,
      };
    });

    res.json(decryptedPasswords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save password
router.post('/', auth, async (req, res) => {
  try {
    const { website, url, username, password, notes } = req.body;
    const user = await User.findById(req.userId);

    // Encrypt password
    const encryptedPassword = CryptoJS.AES.encrypt(
      password, 
      user.encryptionKey
    ).toString();

    const newPassword = new Password({
      userId: req.userId,
      website,
      url,
      username,
      encryptedPassword,
      notes,
    });

    await newPassword.save();
    res.status(201).json(newPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get passwords for specific URL
router.get('/url/:url', auth, async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const domain = new URL(url).hostname;
    
    const passwords = await Password.find({
      userId: req.userId,
      $or: [
        { url: { $regex: domain, $options: 'i' } },
        { website: { $regex: domain, $options: 'i' } }
      ]
    });

    const user = await User.findById(req.userId);
    
    const decryptedPasswords = passwords.map(pwd => {
      const decryptedPassword = CryptoJS.AES.decrypt(
        pwd.encryptedPassword, 
        user.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      
      return {
        ...pwd.toObject(),
        password: decryptedPassword,
      };
    });

    res.json(decryptedPasswords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete password
router.delete('/:id', auth, async (req, res) => {
  try {
    const password = await Password.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!password) {
      return res.status(404).json({ message: 'Password not found' });
    }

    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;