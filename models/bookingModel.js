const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  //? Parent Referencing
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user."]
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour."]
  },
  price: {
    type: Number,
    require: [true, "booking must have a price."]
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    //? This property is useful in case a user doesn't have a credit card, so he will pay cash or smth, after that the admin will make this booking paid
    type: Boolean,
    default: true
  }
});

//? Populate the ref fields (user-tour)
bookingSchema.pre(/^find/, function(next) {
  //? Populate: replace the field we referenced with the actual related data
  //? (The result will look like the embedded one - although it is in a completely different collection)
  this.populate("user").populate({
    path: "tour",
    select: "name"
  });

  next();
});

//? define model variable from schema
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
