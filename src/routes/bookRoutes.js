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

// Post /books/:id/like
router.post('/:id/like', async (req, res) => {
  const {id: book_id} = req.params;
  const {user_id} = req.body;
  console.log('req', req);
  console.log('body', req.body);
  console.log('params', req.params);

  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'});
  }

  try {
    // Kiểm tra bản ghi like đã tồn tại chưa
    const {data: existingLike, error: fetchError} = await supabase
      .from('likes')
      .select('*')
      .eq('book_id', book_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(fetchError.message);
    }

    let is_liked = true;

    if (existingLike) {
      // Toggle trạng thái like
      is_liked = !existingLike.is_liked;

      const {error: updateError} = await supabase
        .from('likes')
        .update({
          is_liked,
          updated_at: new Date().toISOString(),
        })
        .eq('book_id', book_id)
        .eq('user_id', user_id);

      if (updateError) throw new Error(updateError.message);
    } else {
      // Chưa từng like -> thêm bản ghi mới
      const {error: insertError} = await supabase.from('likes').insert({
        user_id,
        book_id,
        is_liked: true,
      });

      if (insertError) throw new Error(insertError.message);
    }

    // Cập nhật số lượng likes trong bảng books
    const {count, error: countError} = await supabase
      .from('likes')
      .select('*', {count: 'exact'})
      .eq('book_id', book_id)
      .eq('is_liked', true);

    if (countError) throw new Error(countError.message);

    await supabase.from('books').update({total_likes: count}).eq('id', book_id);

    res.json({message: is_liked ? 'Liked' : 'Unliked'});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
