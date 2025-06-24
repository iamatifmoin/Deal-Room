import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ MongoDB server is not running or not accessible');
      console.error('💡 If using local MongoDB, make sure mongod is running');
      console.error('💡 If using MongoDB Atlas, check your connection string and network access');
    } else if (error.message.includes('authentication failed')) {
      console.error('❌ MongoDB authentication failed');
      console.error('💡 Check your username and password in the connection string');
    } else if (error.message.includes('timeout')) {
      console.error('❌ MongoDB connection timeout');
      console.error('💡 Check your network connection and MongoDB server status');
    }
    
    process.exit(1);
  }
};

export default connectDB;