const appError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
   const message = `Invalid ${err.path}: ${err.value}`;
   return new appError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
   const value = Object.values(err.keyValue)[0];
   const message = `Duplicate field value: ${value}. Use another value.`;
   return new appError(message, 400);
};
const handleValidationErrorDB = (err) => {
   const errors = Object.values(err.errors).map((el) => el.message);
   const message = `Invalid input data. ${errors.join('. ')}`;
   return new appError(message, 400);
};

const handleJWTError = (err) => {
   return new appError('The token is incorrect', 401);
};

const handleJWTExpiredError = (err) => {
   return new appError('Your token has expired. Please log in again !!', 401);
};

const sendErrorDev = (err, req, res) => {
   if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode).json({
         status: err.status,
         message: err.message,
         stack: err.stack,
         error: err,
      });
   } else {
      res.status(err.statusCode).render('error', {
         title: 'Something went wrong !!',
         msg: err.message,
      });
   }
};

const sendErrorProd = (err, req, res) => {
   //APIs
   if (req.originalUrl.startsWith('/api')) {
      if (err.isOperational) {
         res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
         });
      } else {
         console.error('Something went wrong !!!💥💥', err);

         res.status(err.statusCode).json({
            status: 'error',
            message: 'Something went wrong !!',
         });
      }
   } else {
      // Rendered Website
      if (err.isOperational) {
         res.status(err.statusCode).render('error', {
            title: 'Something went wrong !!',
            msg: err.message,
         });
      } else {
         res.status(err.statusCode).render('error', {
            title: 'Something went wrong !!',
            msg: 'Please try again later',
         });
      }
   }
};

module.exports = (err, req, res, next) => {
   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';

   if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, req, res);
   } else if (process.env.NODE_ENV === 'production ') {
      let error = Object.create(err);
      error.message = err.message;
      if (error.name === 'CastError') error = handleCastErrorDB(error);
      if (error.code === 11000) error = handleDuplicateFieldsDB(error);
      if (error.name === 'ValidationError')
         error = handleValidationErrorDB(error);
      if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
      if (error.name === 'TokenExpiredError')
         error = handleJWTExpiredError(error);

      sendErrorProd(error, req, res);
   }
};
