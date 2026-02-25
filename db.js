const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neoestate';

async function connect() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  pass: String,
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

const propertySchema = new mongoose.Schema({
  title: String,
  location: String,
  price: String,
  features: [String],
  image: String
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Property = mongoose.model('Property', propertySchema);
const Contact = mongoose.model('Contact', contactSchema);

async function seed() {
  // create admin user from env if not exists
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
  const adminEmail = `${ADMIN_USER}@neoestate.local`;
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const passHash = bcrypt.hashSync(ADMIN_PASS, 10);
    await User.create({ name: 'Administrator', email: adminEmail, phone: '', pass: passHash, isAdmin: true });
    console.log('Created admin user:', adminEmail);
  }

  const count = await Property.countDocuments();
  if (count === 0) {
    const props = [
      { title: 'Skyline Residence', location: 'Worli, Mumbai', price: '₹3.2 Cr', features: ['3 BHK','2,200 sqft'], image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200' },
      { title: 'Royal Penthouse', location: 'Indiranagar, Bangalore', price: '₹4.5 Cr', features: ['4 BHK','3,500 sqft'], image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200' },
      { title: 'Emerald Villa', location: 'Whitefield, Bangalore', price: '₹5.8 Cr', features: ['5 BHK','4,800 sqft'], image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200' },
      { title: 'Urban Studio', location: 'Koramangala, Bangalore', price: '₹95 Lac', features: ['1 BHK','650 sqft'], image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200' }
    ];
    await Property.insertMany(props);
    console.log('Seeded sample properties');
  }
}

module.exports = { connect, seed, User, Property, Contact };
