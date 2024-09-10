const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
//const AppError = require("../utils/appError");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //? 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //? 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    //? Session info
    payment_method_types: ["card"],
    mode: "payment",
    // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`, //? redirect to page after success (Secret Link) with all vars we need to create a booking
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, //? redirect to tour page after cancel (Public Link)
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, //? last step (work only with deployed websites)
    line_items: [
      //? product info
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get("host")}/img/tours/${
                tour.imageCover
              }`
            ]
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
        // name: `${tour.name} Tour`,
        // description: tour.summary,
        // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //* accepts only live (hosted) images (because stripe will upload & store them - so works only with deployed websites)
        // amount: tour.price * 100, //* amount expected to be in cents, so 1 usd or euro == 100 cents
        // currency: "usd",
        // quantity: 1
      }
    ]
  });

  //? 3) Create session as response
  res.status(200).json({
    status: "success",
    session
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //! TEMPORARY Solution, EVERYONE can make bookings without paying (by accessing that secret link)
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split("?")[0]); //? to redirect to the secret link without exposing the query string (the real secret thing) | req.originalUrl == Secret Link
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;

  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
