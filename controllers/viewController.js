const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
   // 1) Get tours
   const tours = await Tour.find();

   // 2) Create template

   // 3) Render the page
   res.status(200)
      .set(
         'Content-Security-Policy',
         'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com ws://127.0.0.1:55563/ http://127.0.0.1:3000/api/v1/users/logout https://cdnjs.cloudflare.com/ajax/libs/axios/0.24.0/axios.min.js http://127.0.0.1:3000/api/v1/users/login http://127.0.0.1:3000/api/v1/users/updateMyData http://127.0.0.1:3000/api/v1/users/updateMyPassword http://127.0.0.1:3000/api/v1/users/signup http://127.0.0.1:3000/js/bundle.js:9180'
      )
      .render('overview', {
         title: 'All Tours',
         tours,
      });
});

exports.getTour = catchAsync(async (req, res, next) => {
   // 1) Get tour based on the slug and populate reviews
   const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
   });

   if (!tour) {
      return next(new appError('There is no tour with that name', 404));
   }
   // 2) Create template
   // 3) Render the template
   res.status(200)
      .set(
         'Content-Security-Policy',
         'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com ws://127.0.0.1:55563/ http://127.0.0.1:3000/api/v1/users/logout https://cdnjs.cloudflare.com/ajax/libs/axios/0.24.0/axios.min.js http://127.0.0.1:3000/api/v1/users/login http://127.0.0.1:3000/api/v1/users/updateMyData http://127.0.0.1:3000/api/v1/users/updateMyPassword http://127.0.0.1:3000/api/v1/users/signup http://127.0.0.1:3000/js/bundle.js:9180'
      )
      .render('tour', {
         title: tour.name,
         tour,
      });
});

exports.login = (req, res) => {
   res.status(200)
      .set(
         'Content-Security-Policy',
         'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com ws://127.0.0.1:55563/ http://127.0.0.1:3000/api/v1/users/logout https://cdnjs.cloudflare.com/ajax/libs/axios/0.24.0/axios.min.js http://127.0.0.1:3000/api/v1/users/login http://127.0.0.1:3000/api/v1/users/updateMyData http://127.0.0.1:3000/api/v1/users/updateMyPassword http://127.0.0.1:3000/api/v1/users/signup http://127.0.0.1:3000/js/bundle.js:9180'
      )
      .render('login', {
         title: 'Login',
      });
};

exports.getAccount = (req, res) => {
   res.status(200).render('account', {
      title: 'Your Account',
   });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
   const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
         name: req.body.name,
         email: req.body.email,
      },
      {
         new: true,
         runValidators: true,
      }
   );
   res.status(200).render('account', {
      title: 'Your Account',
      user: updatedUser,
   });
});
