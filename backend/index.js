const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token not found' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user; // Передача данных пользователя в запрос
    next(); // Передача управления следующему обработчику
  });
};


console.log('MONGO_URI:', process.env.MONGO_URI);

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Изменение с username на email
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'engineer', 'viewer'], default: 'viewer' },
});

const User = mongoose.model('User', userSchema);

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body; // Изменяем на email и password

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }); // Поиск пользователя по email
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login successful', token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


const checkRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.user = decoded; // Сохраняем информацию о пользователе
      next();
    } catch (err) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  };
};

app.post('/admin/create-user', checkRole('admin'), async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!['admin', 'engineer', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully', email: user.email, role: user.role });
  } catch (err) {
    if (err.code === 11000) { // Ошибка уникальности email
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id; // Берём ID из токена
  const user = await User.findById(userId).select('email role');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

app.put('/update-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const user = await db.collection('users').findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await db.collection('users').updateOne(
    { email },
    { $set: { password: hashedPassword } }
  );

  res.status(200).json({ message: 'Password updated successfully' });
});


app.get('/users', authenticateToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/users', authenticateToken, async (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword, role });
  await newUser.save();
  res.status(201).json(newUser);
});

app.put('/users/:id', authenticateToken, async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json(user);
});

app.delete('/users/:id', authenticateToken, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.get('/logs/:deviceIP', (req, res) => {
  const deviceIP = req.params.deviceIP;
  const logFilePath = `/var/log/${deviceIP}.log`;

  fs.readFile(logFilePath, 'utf8', (err, data) => {
      if (err) {
          res.status(500).send('Error reading log file');
      } else {
          res.send(data);
      }
  });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
