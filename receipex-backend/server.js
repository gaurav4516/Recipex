const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());

// Multer setup for memory storage (image in memory buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connect MongoDB
mongoose.connect(
  'mongodb+srv://gaauravsingh45:5rai1tre@cluster0.if2qix7.mongodb.net/receipexDB?retryWrites=true&w=majority&appName=Cluster0'
)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

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
  image: String, // Store image as base64 string (optional)
  submittedAt: { type: Date, default: Date.now }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// Login route (unchanged)
app.use(express.json()); // For JSON parsing on login route etc.

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

// Recipe submit route with multer middleware for single file upload
app.post('/submit-recipe', upload.single('food_image'), async (req, res) => {
  try {
    // Because we use multer, fields are in req.body, file in req.file
    const { title, description, steps, category, vegNonVeg, name, email } = req.body;
    
    // Ingredients comes as JSON string or multiple form fields (depends on frontend)
    // Let's handle if ingredients come as a JSON string:
    let ingredients = [];
    if (req.body.ingredients) {
      try {
        ingredients = JSON.parse(req.body.ingredients);
      } catch {
        // fallback to empty array or parse as comma separated string
        ingredients = req.body.ingredients.split(',').map(i => i.trim());
      }
    }

    if (!title || !description || !steps || !ingredients.length || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let imageBase64 = null;
    if (req.file) {
      // Convert buffer to base64 string (for storing in DB)
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

// Start server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
