/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/api/v1/users/login",
      data: {
        email,
        password
      }
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:8000/api/v1/users/logout"
    });
    //? reload the page (force it from the server, not from the browser)
    if (res.data.status === "success") {
      location.reload(true);
      location.assign("/"); //?redirect to homePage, because of the case where a user can be in his account settings, that might cause an error after reload
    }
  } catch (err) {
    showAlert("error", "Error logging out! Try again.");
  }
};
