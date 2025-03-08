import mongoose from 'mongoose';
import { log } from './vite';

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    log('Error: MONGODB_URI is not set');
    return;
  }

  try {
    log('Testing MongoDB connection...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 5000
    });
    log('✓ Successfully connected to MongoDB');
    
    // Test basic operations
    const collections = await mongoose.connection.db.collections();
    log(`✓ Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    log('✓ Connection closed successfully');
  } catch (error) {
    if (error instanceof Error) {
      // Log detailed error info without exposing credentials
      log('MongoDB connection test failed:');
      log(`Error type: ${error.name}`);
      log(`Message: ${error.message}`);
      
      if (error.message.includes('ENOTFOUND')) {
        log('Hint: Check if the hostname in your MongoDB URI is correct');
      } else if (error.message.includes('Authentication failed')) {
        log('Hint: Check your username and password');
      } else if (error.message.includes('timed out')) {
        log('Hint: Check your network connection and MongoDB Atlas IP whitelist');
      }
    }
  }
}

testConnection().catch(console.error);
