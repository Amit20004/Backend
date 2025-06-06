require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

app.use(express.json());

// Reminder schema
const reminderSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 500 },
  remind_at: { type: Date, required: true },
  method: { type: String, required: true, enum: ['sms', 'email', 'other'], default: 'email' },
  created_at: { type: Date, default: Date.now }
});

const Reminder = mongoose.model('Reminder', reminderSchema);

// Create reminder route
app.post('/api/reminders', async (req, res) => {
  const { date, time, message, method } = req.body;

  if (!date || !time || !message || !method) {
    return res.status(400).json({ error: 'Please provide date, time, message, and method.' });
  }

  const remindAt = new Date(`${date}T${time}:00`);
  if (isNaN(remindAt.getTime())) {
    return res.status(400).json({ error: 'Invalid date or time format.' });
  }

  try {
    const reminder = new Reminder({ message, remind_at: remindAt, method });
    const saved = await reminder.save();

    res.status(201).json({
      message: 'Reminder saved',
      id: saved._id,
      details: {
        message: saved.message,
        remind_at: saved.remind_at,
        method: saved.method
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
