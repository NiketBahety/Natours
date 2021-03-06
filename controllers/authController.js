const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
   });
};

const createSendToken = (user, statusCode, res) => {
   const token = signToken(user._id);

   const cookieOptions = {
      expires: new Date(
         Date.now() + process.env.JWT_COKKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
   };

   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

   res.cookie('jwt', token, cookieOptions);

   user.password = undefined;

   res.status(statusCode).json({
      status: 'success',
      token,
      data: {
         user,
      },
   });
};

exports.signup = catchAsync(async (req, res, next) => {
   const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
   });

   createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
   const { email, password } = req.body;

   if (!email || !password) {
      return next(new appError('Please provide email and password !!', 400));
   }

   const user = await User.findOne({ email }).select('+password');

   if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new appError('Incorrect email or password', 401));
   }

   ////////////////
   createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
   res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
   });
   res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
   let token;
   // 1) Getting token and checking if its there
   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      token = req.headers.authorization.split(' ')[1];
   } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
   }

   if (!token) return next(new appError('Please log in to get access'), 401);

   // 2) Token Verification

   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

   // 3) Check if user still exists

   const freshUser = await User.findById(decoded.id);
   if (!freshUser) {
      return next(new appError('The user no longer exists'), 401);
   }

   // 4) Check if user changed password

   if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next(new appError('Please log in again'), 401);
   }

   // Grant access to protected route
   req.user = freshUser;
   res.locals.user = freshUser;
   next();
});

// Only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
   try {
      // 1) Verify Token
      if (req.cookies.jwt) {
         const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
         );

         // 2) Check if user still exists

         const freshUser = await User.findById(decoded.id);
         if (!freshUser) {
            return next();
         }

         // 3) Check if user changed password

         if (freshUser.changedPasswordAfter(decoded.iat)) {
            return next();
         }

         // There is a logged in user
         res.locals.user = freshUser;
         return next();
      }
   } catch (err) {
      return next();
   }
   next();
};

exports.restrictTo = (...roles) => {
   return (req, res, next) => {
      // roles is an array
      if (!roles.includes(req.user.role)) {
         return next(
            new appError('You dont have permission to perform this action', 403)
         );
      }
      next();
   };
};

exports.forgotpassword = catchAsync(async (req, res, next) => {
   // 1) Get user based on POSTed email
   const user = await User.findOne({ email: req.body.email });
   if (!user) {
      return next(new appError('This user does not exist'), 404);
   }

   // 2) Generate random password reset token
   const resetToken = user.createPasswordResetToken();
   await user.save({ validateBeforeSave: false });

   // 3) Send it to user's email
   const resetURL = `${req.protocol}://${req.get(
      'host'
   )}/api/v1/users/resetPassword/${resetToken}`;

   const message = `Forgot your password? Submit a new PATCH request with your new password and confirm password to: ${resetURL}`;

   try {
      await sendEmail({
         email: user.email,
         subject: 'Your password reset token valid only for 10 mins',
         message,
      });

      res.status(200).json({
         status: 'success',
         message: 'Token sent to email !!',
      });
   } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
         new appError(
            'There was an error sending the email. Please try later.'
         ),
         500
      );
   }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
   // 1) Get user based on the token

   const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

   const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
   });

   if (!user) {
      return next(new appError('Token is invalid or has expired'), 404);
   }

   // 2) If the token has not expired, set the new password

   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;
   await user.save();

   // 3) Update changedPasswordAt property for the user

   // 4) Log the user in send JWT

   createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
   // 1) Get the user from database
   const user = await User.findById(req.user.id).select('+password');
   // 2) Check if POSTed password is correct
   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new appError('Your current password is wrong'), 401);
   }
   // 3) Update the password
   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   await user.save();
   // 4) Log the user in / Send JWT
   createSendToken(user, 200, res);
});
