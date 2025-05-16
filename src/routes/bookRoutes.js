const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get /books
router.get('/', async (req, res) => {
  const {data, error} = await supabase
    .from('books')
    .select(
      'id, title, author, views_count, total_likes, total_chapters, cover_image, book_genres (genre_id), genres (id, name)',
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

// Get /books/:id
// Get a book by id
router.get('/:id', async (req, res) => {
  const {id} = req.params;

  const {data, error} = await supabase
    .from('books')
    .select(
      'id, title, author, views_count, total_likes, total_chapters, cover_image, description, book_genres (genre_id), genres (id, name)',
    )
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({error: error.message});
  }

  res.json(data);
});

// Get /books/:id/chapters/first
// Fetch the first chapter of a book
router.get('/:id/chapters/first', async (req, res) => {
  const {id} = req.params;

  try {
    const {data, error} = await supabase
      .from('chapters')
      .select('id, title, chapter_order')
      .eq('book_id', id)
      .order('chapter_order', {ascending: true})
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({error: 'No chapters found for this book'});
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch first chapter'});
  }
});

// Get /chapters/:chapterId/pages
// Fetch all pages for a given chapter
router.get('/chapters/:chapterId/pages', async (req, res) => {
  const {chapterId} = req.params;

  try {
    const {data, error} = await supabase
      .from('pages')
      .select('id, content, page_order, chapter_id')
      .eq('chapter_id', chapterId)
      .order('page_order', {ascending: true});

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({error: 'No pages found for this chapter'});
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch pages'});
  }
});

// Get /books/:id/chapters/next
// Fetch the next chapter based on current chapter_order
router.get('/:id/chapters/next', async (req, res) => {
  const {id} = req.params;
  const {current_order} = req.query;

  if (!current_order) {
    return res.status(400).json({error: 'Current chapter order is required'});
  }

  try {
    const {data, error} = await supabase
      .from('chapters')
      .select('id, title, chapter_order')
      .eq('book_id', id)
      .gt('chapter_order', parseInt(current_order))
      .order('chapter_order', {ascending: true})
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({error: 'No next chapter found'});
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch next chapter'});
  }
});

// Get /books/:id/chapters/previous
// Fetch the previous chapter based on current chapter_order
router.get('/:id/chapters/previous', async (req, res) => {
  const {id} = req.params;
  const {current_order} = req.query;

  if (!current_order) {
    return res.status(400).json({error: 'Current chapter order is required'});
  }

  try {
    const {data, error} = await supabase
      .from('chapters')
      .select('id, title, chapter_order')
      .eq('book_id', id)
      .lt('chapter_order', parseInt(current_order))
      .order('chapter_order', {ascending: false})
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({error: 'No previous chapter found'});
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch previous chapter'});
  }
});

module.exports = router;
