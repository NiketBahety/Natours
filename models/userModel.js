const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please tell us your name.'],
      trim: true,
      maxlength: [40, 'A user name cannot be longer than 40 characters'],
      minlength: [10, 'A user name cannot be less than 10 characters'],
   },
   email: {
      type: String,
      required: [true, 'Required Field !!'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail],
   },
   photo: {
      type: String,
      default: 'default.jpg',
   },
   role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
   },
   password: {
      type: String,
      required: [true, 'Password is needed !!'],
      minlength: [8, 'A password cannot be less than 8 characters'],
      trim: true,
      select: false,
   },
   passwordConfirm: {
      type: String,
      required: true,
      trim: true,
      validate: {
         validator: function (el) {
            return el === this.password;
         },
         message: 'Passwords do not match',
      },
   },
   passwordChangedAt: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
      type: Boolean,
      default: true,
      select: false,
   },
});

userSchema.pre('save', async function (next) {
   if (!this.isModified('password')) return next();

   this.password = await bcrypt.hash(this.password, 12);

   this.passwordConfirm = undefined;
   next();
});

userSchema.pre('save', function (next) {
   if (!this.isModified('password') || this.isNew) return next();

   this.passwordChangedAt = Date.now() - 1000;
   next();
});

userSchema.pre(/^find/, function (next) {
   this.find({ active: { $ne: false } });
   next();
});

userSchema.methods.correctPassword = async function (
   candidatePassword,
   userPassword
) {
   return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
   if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
         this.passwordChangedAt.getTime() / 1000,
         10
      );
      return JWTTimestamp < changedTimestamp;
   }

   // FALSE means not changed
   return false;
};

userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex');

   this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

   console.log({ resetToken }, this.passwordResetToken);

   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

   return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
