const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connect, seed, User, Property, Contact } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

connect().then(() => seed()).catch(err=>console.error('DB connect error',err));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'Missing token' });
  const token = h.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
}

app.post('/api/register', async (req, res) => {
  try{
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email exists' });
    const passHash = bcrypt.hashSync(password, 10);
    const u = await User.create({ name, email, phone, pass: passHash });
    const user = { id: u._id, name: u.name, email: u.email, phone: u.phone };
    const token = createToken({ ...user, isAdmin: u.isAdmin ? 1 : 0 });
    res.json({ user, token });
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

app.post('/api/login', async (req, res) => {
  try{
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const row = await User.findOne({ email });
    if (!row) return res.status(404).json({ error: 'User not found' });
    const ok = bcrypt.compareSync(password, row.pass);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    const user = { id: row._id, name: row.name, email: row.email, phone: row.phone };
    const token = createToken({ ...user, isAdmin: row.isAdmin ? 1 : 0 });
    res.json({ user, token });
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

app.post('/api/contact', async (req, res) => {
  try{
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) return res.status(400).json({ error: 'Missing fields' });
    await Contact.create({ name, email, phone, message });
    res.json({ ok: true });
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

app.get('/api/properties', async (req, res) => {
  try{
    const rows = await Property.find().sort({ _id: -1 }).lean();
    res.json(rows);
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing' });
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = createToken({ username, isAdmin: 1 });
    return res.json({ token });
  }
  // also support seeded admin user
  const adminEmail = `${username}@neoestate.local`;
  const admin = await User.findOne({ email: adminEmail });
  if (admin && admin.isAdmin && bcrypt.compareSync(password, admin.pass)) {
    const token = createToken({ id: admin._id, isAdmin: 1 });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const properties = await Property.countDocuments();
    const users = await User.countDocuments();
    const contacts = await Contact.countDocuments();
    res.json({ properties, users, contacts });
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

app.post('/api/admin/properties', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const { title, location, price, features, image } = req.body;
    if (!title || !location) return res.status(400).json({ error: 'Missing fields' });
    const p = await Property.create({ title, location, price: price || '', features: features || [], image: image || '' });
    res.json({ id: p._id });
  }catch(e){console.error(e);res.status(500).json({error:'Server error'})}
});

// fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
