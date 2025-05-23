const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config(); // Load env variables

const app = express();
app.use(cors());
app.use(express.json()); // Required for login JSON body

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Use env variable for Mongo URI
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ... (your schema, routes, etc remain same)

// ✅ Use dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
