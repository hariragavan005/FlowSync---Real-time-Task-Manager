const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.mongo_url;
    if (!uri) {
      throw new Error("MongoDB Connection URI is missing! Please define MONGO_URI or mongo_url in your environment variables.");
    }
    const conn = await mongoose.connect(uri, {
      dbName: 'Taskmanager'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
