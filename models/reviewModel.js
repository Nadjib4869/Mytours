const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"]
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    //? Parent Referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."]
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."]
    }
  },
  {
    //? Schema Options - show virtual properties (a field not stored in the db)
    toJSON: { virtuals: true }, //? each time the data is outputed as a JSON print the virtuals
    toObject: { virtuals: true } //? each time the data is outputed as an Object print the virtuals
  }
);

//? Populate the ref fields (user-tour)
reviewSchema.pre(/^find/, function(next) {
  //? Populate: replace the field we referenced with the actual related data
  //? (The result will look like the embedded one - although it is in a completely different collection)
  // this.populate({
  //   path: "user",
  //   select: "name photo"
  // }).populate({
  //   path: "tour",
  //   select: "name"
  // });

  //! The thing we wanna add also is that the tour should also have the reviews
  //! (because in our case - parent ref the parent(tour) doesn't know about his reviews)
  //! The Sol without doing the embedding is to create a reviews field in the tour model
  //! And virtually populate it (it won't save up in our db),
  //! Also we will do it only in getTour and not for the getAllTours (we don't need details here)

  this.populate({
    path: "user",
    select: "name photo"
  });

  next();
});

//? define model variable from schema
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
