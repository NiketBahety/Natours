const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', (err) => {
//    console.log(err.name, err.message);
//    console.log('Uncaught exception 💥💥');
//    process.exit(1);
// });

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
   '<PASSWORD>',
   process.env.DATABASE_PASSWORD
);

mongoose
   .connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
   })
   .then(() => {
      console.log('DB connections succesful');
   });

const port = process.env.PORT;
const server = app.listen(port, () => {
   console.log(` App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
   console.log(err.name, err.message);
   console.log('Unhandled rejection 💥💥');
   server.close(() => {
      process.exit(1);
   });
});
