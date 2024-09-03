/* eslint-disable */
import axios from "axios";
const stripe = Stripe(
  "pk_test_51PtQeAFsxENQEXnZRZTFuEnEBKTkKGPLocuEcUiQ6MShj7f4WRoFKoeN2OWFAIYbuKrYx03nxND1rTKVjSVHNpGn007dHztlPb"
);
import { showAlert } from "./alerts";

export const bookTour = async tourId => {
  try {
    //* 1) Get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    //console.log(session);

    //* 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err.response.data.message);
  }
};
