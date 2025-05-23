require('dotenv').config(); // Load .env variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

const app = express();

// CORS setup - allow origins from .env ALLOWED_ORIGINS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json()); // Parse JSON requests

// Multer setup for memory storage (image upload handling)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String
});
const User = mongoose.model('User', userSchema);

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  steps: String,
  ingredients: [String],
  category: String,
  image: String,
  submittedAt: { type: Date, default: Date.now }
});
const Recipe = mongoose.model('Recipe', recipeSchema);

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      const nameFromEmail = email.split('@')[0];
      user = new User({ email, password, name: nameFromEmail });
      await user.save();
      console.log('✅ New user added:', user);
      return res.status(200).json({ message: 'New user registered and logged in' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log('✅ Existing user logged in:', user);
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recipe submission route
app.post('/submit-recipe', upload.single('food_image'), async (req, res) => {
  try {
    const { title, description, steps, category } = req.body;

    let ingredients = [];
    if (req.body.ingredients) {
      try {
        ingredients = JSON.parse(req.body.ingredients);
      } catch {
        ingredients = req.body.ingredients.split(',').map(i => i.trim());
      }
    }

    if (!title || !description || !steps || !ingredients.length || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let imageBase64 = null;
    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const newRecipe = new Recipe({
      title,
      description,
      steps,
      ingredients,
      category,
      image: imageBase64
    });

    await newRecipe.save();

    console.log('✅ Recipe submitted:', newRecipe);
    res.status(201).json({ message: 'Recipe submitted successfully!' });
  } catch (error) {
    console.error('❌ Recipe submission error:', error);
    res.status(500).json({ error: 'Failed to submit recipe' });
  }
});

// Start the server
const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
app.get('/', (req, res) => {
  res.send('✅ RecipeX Backend is live!');
});

