const mongoose = require("mongoose");
const options = {
  //   useNewUrlParser: true,
  //   useCreateIndex: true,
  autoIndex: true,
  //   keepAlive: true,
  //   poolSize: 10,
  //   bufferMaxEntries: 0,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  //   useFindAndModify: false,
  //   useUnifiedTopology: true,
};

mongoose
  .connect(process.env.MONGODB_URL, options)
  .then(() => {
    console.log("Connected to database...");
  })
  .catch((err) => {
    console.log("database.js err:", err);
    console.log("Error => Cannot connect to database!");
  });
