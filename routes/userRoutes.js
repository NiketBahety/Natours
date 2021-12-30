const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgotpassword').post(authController.forgotpassword);
router.route('/resetpassword/:token').patch(authController.resetpassword);

router.get(
   '/me',
   authController.protect,
   userController.getMe,
   userController.getUser
);

// Protect all routes after this middleware

router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);
router
   .route('/updateMe')
   .patch(
      userController.uploadUserPhoto,
      userController.resizeUserPhoto,
      userController.updateMe
   );
router.route('/deleteMe').delete(userController.deleteMe);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
   .route('/:id')
   .get(userController.getUser)
   .patch(userController.updateUser)
   .delete(userController.deleteUser);

module.exports = router;
