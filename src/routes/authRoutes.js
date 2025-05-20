const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({error: 'Missing email or password'});
  }

  try {
    const {data: user, error} = await supabase
      .from('users')
      .select('id, email, password, username')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    // Trả về thông tin người dùng (có thể thêm token nếu cần)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({error: 'Login failed: ' + error.message});
  }
});

router.post('/register', async (req, res) => {
  const {username, email, password} = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({error: 'Missing fields'});
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const {data: existingUser, error: checkError} = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle(); // sử dụng maybeSingle để không throw nếu không có user

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (existingUser) {
      return res.status(400).json({error: 'Email already registered'});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const {data: insertedUser, error: insertError} = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
      })
      .select('id, email, username')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: insertedUser.id,
        email: insertedUser.email,
        username: insertedUser.username,
      },
    });
  } catch (error) {
    res.status(500).json({error: 'Failed to register: ' + error.message});
  }
});

module.exports = router;
