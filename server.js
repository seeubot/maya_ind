require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
let db;
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db('bottlerush');
    console.log('✅ Connected to MongoDB Atlas');
    await seedProducts();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
async function seedProducts() {
  const count = await db.collection('products').countDocuments();
  if (count > 0) return;

  const products = [
    // Beer
    { name: 'Kingfisher Strong', brand: 'Kingfisher', category: 'beer', volume: 650, unit: 'ml', price: 120, emoji: '🍺', inStock: true, tags: ['lager', 'popular'], rating: 4.2 },
    { name: 'Heineken', brand: 'Heineken', category: 'beer', volume: 500, unit: 'ml', price: 180, emoji: '🍺', inStock: true, tags: ['premium', 'imported'], rating: 4.5 },
    { name: 'Bira 91 White', brand: 'Bira', category: 'beer', volume: 330, unit: 'ml', price: 150, emoji: '🍺', inStock: true, tags: ['craft', 'wheat'], rating: 4.3 },
    { name: 'Corona Extra', brand: 'Corona', category: 'beer', volume: 355, unit: 'ml', price: 200, emoji: '🍺', inStock: false, tags: ['imported', 'premium'], rating: 4.4 },

    // Wine
    { name: 'Sula Brut', brand: 'Sula', category: 'wine', volume: 750, unit: 'ml', price: 850, emoji: '🍷', inStock: true, tags: ['sparkling', 'indian'], rating: 4.1 },
    { name: 'Jacob\'s Creek Shiraz', brand: "Jacob's Creek", category: 'wine', volume: 750, unit: 'ml', price: 1200, emoji: '🍷', inStock: true, tags: ['red', 'imported'], rating: 4.3 },
    { name: 'Grover Zampa Chardonnay', brand: 'Grover Zampa', category: 'wine', volume: 750, unit: 'ml', price: 950, emoji: '🥂', inStock: true, tags: ['white', 'indian'], rating: 4.0 },

    // Whisky
    { name: 'Royal Stag', brand: 'Seagram\'s', category: 'whisky', volume: 750, unit: 'ml', price: 580, emoji: '🥃', inStock: true, tags: ['blended', 'popular'], rating: 3.9 },
    { name: 'Johnnie Walker Black', brand: 'Johnnie Walker', category: 'whisky', volume: 750, unit: 'ml', price: 3500, emoji: '🥃', inStock: true, tags: ['scotch', 'premium', 'imported'], rating: 4.7 },
    { name: 'Blenders Pride', brand: 'Seagram\'s', category: 'whisky', volume: 750, unit: 'ml', price: 1100, emoji: '🥃', inStock: true, tags: ['blended', 'premium'], rating: 4.2 },

    // Vodka
    { name: 'Magic Moments', brand: 'Radico', category: 'vodka', volume: 750, unit: 'ml', price: 480, emoji: '🍸', inStock: true, tags: ['indian', 'popular'], rating: 3.8 },
    { name: 'Absolut Original', brand: 'Absolut', category: 'vodka', volume: 750, unit: 'ml', price: 1800, emoji: '🍸', inStock: true, tags: ['premium', 'imported'], rating: 4.5 },
  ];

  await db.collection('products').insertMany(products);
  console.log(`🌱 Seeded ${products.length} products`);
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check (used by Dockerfile HEALTHCHECK + Koyeb)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all products (optional ?category= filter)
app.get('/api/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    const products = await db.collection('products').find(filter).toArray();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.collection('products').findOne({
      _id: new ObjectId(req.params.id)
    });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create order
app.post('/api/orders', async (req, res) => {
  try {
    const { items, address, phone, deliveryInstructions } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }
    if (!address || !address.lat) {
      return res.status(400).json({ success: false, error: 'Delivery address required' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 49;
    const total = subtotal + deliveryFee;

    const order = {
      items,
      subtotal,
      deliveryFee,
      total,
      address,
      phone,
      deliveryInstructions: deliveryInstructions || '',
      status: 'placed',
      estimatedMinutes: 35,
      createdAt: new Date(),
    };

    const result = await db.collection('orders').insertOne(order);
    res.status(201).json({
      success: true,
      data: { orderId: result.insertedId, total, estimatedMinutes: 35 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.collection('orders').findOne({
      _id: new ObjectId(req.params.id)
    });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── URL Rewriting (no .html) ─────────────────────────────────────────────────
const pages = ['menu', 'cart', 'order-confirm'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', `${page}.html`))
  );
});

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BottleRush running on http://0.0.0.0:${PORT}`);
  });
});
