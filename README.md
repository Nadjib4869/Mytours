# Tours web App (RESTful API + Pug Template Engine)

This project is a tours web app. It was built using Node.js, Express, MongoDB, Mongoose and Pug. The API allows users to create, read, update, and delete tours, users, reviews and bookings. It also allows users to sign up, log in, and log out.

## Features :

Mapbox API for geocoding
Stripe API for payments
Sendgrid API for emails
JWT for authentication
Bcrypt for password hashing
Mongoose for data modeling
Multer for file uploads
Sharp for image resizing
Helmet for security
Express Rate Limit for rate limiting
CORS for cross-origin resource sharing
HPP for HTTP parameter pollution
XSS for cross-site scripting
Express Mongo Sanitize for NoSQL query injection


## Objective :

### Deploying the APP on Azure
### Use Chargily for payments instead of Stripe

## Testing :

Link

## Installation :

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Create a `.env` file in the root directory and add the following environment variables:
```
NODE_ENV=development
PORT=3000
DATABASE_LOCAL=mongodb://localhost:27017/tours
DATABASE_PASSWORD=your_mongodb_password
DATABASE=mongodb+srv://your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=smtp.your_email_host
EMAIL_PORT=your_email_port
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_sendgrid_from_email
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
MAPBOX_API_KEY=your_mapbox_api_key
```
4. Run `npm run dev` to start the server
5. Open your browser and navigate to `http://localhost:3000`

## API Documentation :

There is also an API at `/api`, with [documentation available here](https://documenter.getpostman.com/view/33493267/2sA3s9D8ac).
