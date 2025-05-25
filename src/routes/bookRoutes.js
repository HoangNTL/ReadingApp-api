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

// GET /books/like
// get all books liked by a user
router.get('/like', async (req, res) => {
  const {user_id} = req.query;

  if (!user_id) {
    return res.status(400).json({message: 'Missing user_id'});
  }

  try {
    const {data, error} = await supabase
      .from('likes')
      .select('books(id, title, cover_image)')
      .eq('user_id', user_id)
      .eq('is_liked', true);

    if (error) throw error;

    const likedBooks = data.map(entry => entry.books);

    return res.json(likedBooks);
  } catch (error) {
    console.error('Error fetching liked books:', error);
    return res.status(500).json({message: 'Internal server error'});
  }
});

// GET /books/save
// Get all books saved by a user
router.get('/save', async (req, res) => {
  const {user_id} = req.query;

  if (!user_id) {
    return res.status(400).json({message: 'Missing user_id'});
  }

  try {
    const {data, error} = await supabase
      .from('saved_books')
      .select('books(id, title, cover_image)')
      .eq('user_id', user_id)
      .eq('is_saved', true);

    if (error) throw error;

    const savedBooks = data.map(entry => entry.books);

    return res.json(savedBooks);
  } catch (error) {
    console.error('Error fetching saved books:', error);
    return res.status(500).json({message: 'Internal server error'});
  }
});

// Get /books/search
// Search for books by title or author
router.get('/search', async (req, res) => {
  const {keyword} = req.query;

  if (!keyword) {
    return res.status(400).json({message: 'Missing keyword'});
  }

  try {
    const {data, error} = await supabase
      .from('books')
      .select(
        'id, title, author, views_count, total_likes, total_chapters, cover_image, book_genres (genre_id), genres (id, name)',
      )
      .ilike('title', `%${keyword}%`);

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error searching books:', error);
    return res.status(500).json({message: 'Internal server error'});
  }
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

  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'});
  }

  try {
    // Kiểm tra bản ghi like có tồn tại không
    const {data: existingLike, error: fetchError} = await supabase
      .from('likes')
      .select('*')
      .eq('book_id', book_id)
      .eq('user_id', user_id)
      .maybeSingle(); // Không lỗi nếu không có bản ghi

    let is_liked;

    if (existingLike) {
      // Đã từng like => Toggle trạng thái
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
      // Chưa từng like => Thêm mới
      is_liked = true;

      const {error: insertError} = await supabase.from('likes').insert({
        user_id,
        book_id,
        is_liked: true,
      });

      if (insertError) throw new Error(insertError.message);
    }

    // Cập nhật tổng số like trong bảng books
    const {count, error: countError} = await supabase
      .from('likes')
      .select('*', {count: 'exact', head: true})
      .eq('book_id', book_id)
      .eq('is_liked', true);

    if (countError) throw new Error(countError.message);

    const {error: updateBookError} = await supabase
      .from('books')
      .update({total_likes: count})
      .eq('id', book_id);

    if (updateBookError) throw new Error(updateBookError.message);

    res.status(200).json({
      message: is_liked ? 'Liked' : 'Unliked',
      is_liked,
      total_likes: count,
    });
  } catch (error) {
    res.status(500).json({error: 'Like action failed: ' + error.message});
  }
});

// Get /books/:id/like
// Check if a user has liked a book
router.get('/:id/like', async (req, res) => {
  const {id: book_id} = req.params;
  // const {user_id} = req.body;
  const {user_id} = req.query;

  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'});
  }

  try {
    const {data: like, error} = await supabase
      .from('likes')
      .select('is_liked')
      .eq('book_id', book_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    res.json({
      is_liked: like?.is_liked === true, // Trả về true nếu like tồn tại và là true
    });
  } catch (error) {
    res
      .status(500)
      .json({error: 'Failed to get like status: ' + error.message});
  }
});

// POST /books/:id/save
// Save or unsave a book for a user
router.post('/:id/save', async (req, res) => {
  const {id: book_id} = req.params;
  const {user_id} = req.body;

  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'});
  }

  try {
    // Kiểm tra xem user đã từng lưu chưa
    const {data: existingSave, error: fetchError} = await supabase
      .from('saved_books')
      .select('*')
      .eq('book_id', book_id)
      .eq('user_id', user_id)
      .maybeSingle();

    let is_saved;

    if (existingSave) {
      // Toggle trạng thái lưu
      is_saved = !existingSave.is_saved;

      const {error: updateError} = await supabase
        .from('saved_books')
        .update({
          is_saved,
          updated_at: new Date().toISOString(),
        })
        .eq('book_id', book_id)
        .eq('user_id', user_id);

      if (updateError) throw new Error(updateError.message);
    } else {
      // Lưu lần đầu
      is_saved = true;

      const {error: insertError} = await supabase.from('saved_books').insert({
        user_id,
        book_id,
        is_saved: true,
      });

      if (insertError) throw new Error(insertError.message);
    }

    res.status(200).json({
      message: is_saved ? 'Saved' : 'Unsaved',
      is_saved,
    });
  } catch (error) {
    res.status(500).json({error: 'Save action failed: ' + error.message});
  }
});

// GET /books/:id/save
// Check if a user has saved a book
router.get('/:id/save', async (req, res) => {
  const {id: book_id} = req.params;
  const {user_id} = req.query;

  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'});
  }

  try {
    const {data: save, error} = await supabase
      .from('saved_books')
      .select('is_saved')
      .eq('book_id', book_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    res.json({
      is_saved: save?.is_saved === true, // Trả về true nếu đã lưu
    });
  } catch (error) {
    res
      .status(500)
      .json({error: 'Failed to get save status: ' + error.message});
  }
});

module.exports = router;
