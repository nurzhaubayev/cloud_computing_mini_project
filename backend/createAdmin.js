const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Определение схемы пользователя
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'engineer', 'viewer'], default: 'viewer' },
});

const User = mongoose.model('User', userSchema);

// Функция для создания администратора
const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('your_admin_password', 10);
    const admin = new User({
      email: 'test@qmul.com',
      password: hashedPassword,
      role: 'admin',
    });
    await admin.save();
    console.log('Admin user created successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admin user:', err);
    mongoose.connection.close();
  }
};

// Создание пользователя-администратора
createAdmin();
