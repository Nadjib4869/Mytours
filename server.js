const mongoose = require("mongoose");
const dotenv = require("dotenv");

//! catching uncaught exceptions (console.log(x), x is not defined)
process.on("uncaughtException", err => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("DB connection successful"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
  //console.log(10 ** 9);
});

//! Errors outside of Express (unhandled promise rejection)
process.on("unhandledRejection", err => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

//! Render restarts the server every 24 hours
//? So we need to handle SIGTERM signal
process.on("SIGTERM", () => {
  console.log("📢 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});

//! MongoDB :
//? 1. MongoDB is a NoSQL database program, which uses JSON-like (BSON) documents with optional schemas.
//? 2. Cluster is a collection of databases on a single server.
//? 3. Database is a physical container for collections. Each database gets its own set of files on the file system.
//? 4. Collection is a group of MongoDB documents.
//? 5. Document is a set of key-value pairs.
//? 6. Field is a key-value pair in a document.

//! Mongoose :
//? 1. Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js.
//? Model is a representation of a collection in a database.
//? Schema is a representation of the structure of documents within a collection.
//? 2. schemas are blueprints for models, and models are constructors compiled from schemas.
