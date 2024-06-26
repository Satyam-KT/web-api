const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const JWT_SECRET = 'sktabc';

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
    otp: { type: String},
    location: { type: String},
    age: { type: Number}, 
    workDetails: { type: String}
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());

// Authentication Middleware
function authenticateToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if(err){
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

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
      const newUser = new User({ email, password, otp });
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

// API endpoint for validating OTP and adding extra information
app.post('/validate', async (req, res) => {
  const { email, otp, location, age, workDetails} = req.body;
  try {
    const user = await User.findOne({ email, otp });
    if(!user){
      return res.status(400).json({ message: 'Invalid OTP'});
    }

    // Update user profile with additional information
    user.location = location;
    user.age = age;
    user.workDetails = workDetails;
    await user.save();

    res.status(200).json({ message: 'User Profile updated successfully'});
  } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// API endpoint for user login and JWT token generation
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if(!user || user.password !== password){
      return res.status(401).json({ message: 'Invalid Email or Password' });
    }

    // Generate JWT token
    const token = jwt.sign({ email: user.email }, JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error'});
  }
});

// API endpoint to retrieve user information
app.get('/user', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email });
    if(!user){
      res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});