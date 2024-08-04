const nodemailer = require("nodemailer");

const sendEmail = async options => {
  //* 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    //? Activate in gmail "less secure app" option
    //? Note: Gmail isn't practical for production because: u can send only 500mail/day + u will be marked as spam
    //? So instead for development use: mailtrap, for production use: SendGrid or Mailgun
  });

  //* 2) Define the email options
  const mailOptions = {
    from: "Mohamed Nadjib Taleb <nadjib@mytours.io>",
    to: options.email,
    subject: options.subject,
    text: options.message
    //html:
  };

  //* 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
