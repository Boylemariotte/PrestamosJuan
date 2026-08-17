import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const uri = process.env.MONGO_URI;
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('CONNECTED OK:', mongoose.connection.host);
  const count = await mongoose.connection.db.collection('creditos').countDocuments();
  console.log('creditos count:', count);
  await mongoose.disconnect();
} catch (err) {
  console.error('CONNECT FAILED:', err.message);
  process.exit(1);
}
