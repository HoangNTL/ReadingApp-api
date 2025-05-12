const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const booksRouter = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', async (req, res) => {
  res.end('<h1>Reading Book API</h1>');
});

app.use('/books', booksRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});