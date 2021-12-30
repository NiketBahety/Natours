const multer = require('multer');
const sharp = require('sharp');
const appError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//    destination: (req, file, cb) => {
//       cb(null, 'public/img/users');
//    },
//    filename: (req, file, cb) => {
//       const ext = file.mimetype.split('/')[1];
//       cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//    },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) cb(null, true);
   else cb(new appError('Not an image', 400), false);
};

const upload = multer({
   storage: multerStorage,
   fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
   const newObj = {};
   Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
   });
   return newObj;
};

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
   if (!req.file) return next();

   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

   await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

   next();
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
   // 1) Create error if user POSTs enter password data
   if (req.body.password || req.body.passwordConfirm) {
      return next(
         new appError(
            'This route is not for password updates !! Please use /updateMyPassword'
         ),
         400
      );
   }
   // 2) Update user data

   const filteredBody = filterObj(req.body, 'name', 'email');
   if (req.file) filteredBody.photo = req.file.filename;

   const updateduser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true, // Send the new user that is after updating
      runValidators: true,
   });
   res.status(200).json({
      status: 'success',
      data: {
         updateduser,
      },
   });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
   await User.findByIdAndUpdate(req.user.id, { active: false });

   res.status(204).json({
      status: 'success',
      data: null,
   });
   next();
});

exports.getMe = (req, res, next) => {
   req.params.id = req.user.id;
   next();
};
