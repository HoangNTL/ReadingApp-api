const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', async (req, res) => {
  res.end('<h1>Reading Book API</h1>');
});

app.use('/books', bookRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});