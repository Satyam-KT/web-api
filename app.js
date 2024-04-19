const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/WebApi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define a User schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String}
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testnodemail1082@gmail.com',
    pass: 'zikxzmhgsnxzwsxl'
  }
});

// Generate a random 6-digit OTP
function generateOTP(){
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// API endpoint for user registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const otp = generateOTP();
      const newUser = new User({ email, password });
      await newUser.save();

      // Send otp via email
      const mailOptions = {
        from: 'testnodemail1082@gmail.com',
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for registration is: ${otp}`
      }
      await transporter.sendMail(mailOptions);

      res.status(201).json({ message: 'User registered successfully. OTP sent to your email' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});