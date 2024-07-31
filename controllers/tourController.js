const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

//! Middlewares
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage price"; //? ratings in descending && price in ascending if ratings are equal
  req.query.fields = "name price ratingsAverage summary difficulty";
  next();
};

//! ROUTE HANDLERS
exports.getAllTours = catchAsync(async (req, res, next) => {
  //? EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  //? SEND RESPONSE
  res.status(200).json({
    //? Jsend
    status: "success",
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //? you can add an optional param x at the end (/:x?)
  const tour = await Tour.findById(req.params.id); //* instead of Tour.findOne({ _id: req.params.id })

  //! if (Id is valid but no tour found for it) tour == null == false
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // create a doc then calling the save method on the new doc
  // const newTour = new Tour({}); //* Here newTour is Tour.prototype (instance of Tour model)
  // newTour.save();

  // calling the create method directly on the Tour model
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour //? to send the newly created obj as a respond (Classic thing we doing a post)
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    //* options
    new: true, //? to return the updated doc
    runValidators: true //? to run the validators again
  });

  //! if (Id is valid but no tour found for it) tour == null == false
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  //! if (Id is valid but no tour found for it) tour == null == false
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

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
