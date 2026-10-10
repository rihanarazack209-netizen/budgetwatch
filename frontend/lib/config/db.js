const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️ Local MongoDB not reachable on port 27017: ${error.message}`);
    console.log('⚡ Initializing seamless In-Memory Database Mode with full Government dataset pre-loaded!');
    console.log('💡 Note: To persist to MongoDB, start MongoDB locally or set MONGO_URI in .env');
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
