const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get /books
router.get('/', async (req, res) => {
  const {data, error} = await supabase
    .from('books')
    .select(
      'id, title, author, views_count, total_likes, total_chapters, cover_image, description, book_genres (genre_id), genres (id, name)',
    );

  if (error) {
    return res.status(500).json({error: error.message});
  }
  
  res.json(data);
});

// Get /books/top-viewed
// Get the top 10 most viewed books
router.get('/top-viewed', async (req, res) => {
  const {data, error} = await supabase
    .from('books')
    .select('id, title, cover_image')
    .order('views_count', {ascending: false})
    .limit(10);

  if (error) {
    return res.status(500).json({error: error.message});
  }

  res.json(data);
});

// Get /books/latest
// Get the latest 10 books
router.get('/latest', async (req, res) => {
  const {data, error} = await supabase
    .from('books')
    .select('id, title, cover_image')
    .order('updated_at', {ascending: false})
    .limit(10);

  if (error) {
    return res.status(500).json({error: error.message});
  }

  res.json(data);
});

module.exports = router;
