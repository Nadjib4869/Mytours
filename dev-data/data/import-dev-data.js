//! Script to import data(Json file) into the database

const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel"); //? Importing the Tour model(Where we wanna save our data)
const Review = require("../../models/reviewModel"); //? Importing the Review model(Where we wanna save our data)
const User = require("../../models/userModel"); //? Importing the User model(Where we wanna save our data)

dotenv.config({ path: "../../config.env" });
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

//? Read JSON file
const tours = JSON.parse(
  //? Parsing the JSON file (from Json to JS object)
  fs.readFileSync(`${__dirname}/tours.json`, "utf-8")
);
const users = JSON.parse(
  //? Parsing the JSON file (from Json to JS object)
  fs.readFileSync(`${__dirname}/users.json`, "utf-8")
);
const reviews = JSON.parse(
  //? Parsing the JSON file (from Json to JS object)
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

//? Import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//? Delete all data from collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err.messsage);
  }
  process.exit();
};

//? To run this script in the terminal
console.log(process.argv);

if (process.argv[2] === "--import") {
  //? node import-dev-data.js --import
  importData();
} else if (process.argv[2] === "--delete") {
  //? node import-dev-data.js --delete
  deleteData();
}
