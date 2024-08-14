const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

//! Middlewares
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage price"; //? ratings in descending && price in ascending if ratings are equal
  req.query.fields = "name price ratingsAverage summary difficulty";
  next();
};

//! ROUTE HANDLERS
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    //? array of objects (each object have a stage) of object (queries) of object (operators)
    {
      $match: { ratingsAverage: { $gte: 4.5 } } //? to bring only those ratingsAverage are greater than or equal to 4.5
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" }, //? to group them according to the difficulty - and print the difficulty in upperCase
        numTours: { $sum: 1 }, //? to display the total tours in this id and match
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      $sort: { avgPrice: 1 } //? 1 for ascending sort, -1 for descending sort according to the avgPrice
    },
    {
      $match: { _id: { $ne: "EASY" } } //? to bring only those ids aren't equal to "EASY"
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //? count tours of each month for a given year
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      //? deconstruct an array field from the info documents then output one document for each element of the array (startDates)
      $unwind: "$startDates" //? to have a tour document for each date (because in our data a tour can have multiple startDates-as an array)
    },
    {
      //? select - filter the given year
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        }
      }
    },
    {
      //? group them according to the month of the startDate
      $group: {
        _id: { $month: "$startDates" },
        //* This doesn't work : month: { $month: "$startDates" } Because $group stage expects fields to either accumulate values($sum, $avg ...)
        //* or to group documents by a certain key (in the _id)
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" } //? to create an array of tours names
      }
    },
    {
      $addFields: {
        month: "$_id" //? to add a field called month has the same val of _id
      }
    },
    {
      $project: {
        _id: 0 //? to not display the _id
      }
    },
    {
      $sort: { numToursStarts: -1 } //? sort the res ascending according to the month
    },
    {
      $limit: 12 //? this will display only the first 12 docs
    }
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan
    }
  });
});
