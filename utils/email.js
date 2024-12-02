const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  }
});

function getBaseUrl() {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    console.error('FRONTEND_URL is not set in the environment variables');
    return 'http://localhost:3000'; // Fallback URL
  }
  return frontendUrl;
}

exports.sendVerificationEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome to Our School Result Management System</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
};

exports.sendPasswordResetEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password. Please click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
};

// Add a test function to check the email configuration
exports.testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is correct');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};