const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  masterPassword: {
    type: String,
    required: true,
  },
  encryptionKey: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('masterPassword')) return next();
  this.masterPassword = await bcrypt.hash(this.masterPassword, 12);
  next();
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.masterPassword);
};

module.exports = mongoose.model('User', UserSchema);