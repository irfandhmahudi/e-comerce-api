import nodemailer from "nodemailer";

const sendEmail = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1 style="font-size: 20px; color: #333;">Your OTP Code</h1>
          <div style="font-size: 20px; font-weight: bold; color: #FF5733;">
            ${message}
          </div>
          <p style="font-size: 18px; color: #333;">Please use the OTP above to verify your account.</p>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
