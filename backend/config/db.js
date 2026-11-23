// config/db.js
// Connects to MongoDB using MONGO_URI from backend/.env
//
// If MongoDB cannot be reached (wrong URI, Atlas cluster paused, no internet...)
// we do NOT crash. We print the reason and try again every 15 seconds,
// so the app recovers by itself once the database is back.
import mongoose from 'mongoose';

const RETRY_SECONDS = 15;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // give up a single try after 10s
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    console.error(`  -> Check MONGO_URI (and in MongoDB Atlas: cluster not paused, IP allowed). Retrying in ${RETRY_SECONDS}s...`);
    setTimeout(connectDB, RETRY_SECONDS * 1000);
  }
};

// true when MongoDB is connected and ready
export const isDBConnected = () => mongoose.connection.readyState === 1;

// Used by /api/health: sends a real command to MongoDB
// (this also counts as activity, so MongoDB Atlas does not pause an idle free cluster)
export async function databaseStatus() {
  if (!isDBConnected()) return 'not connected';
  try {
    await mongoose.connection.db.admin().ping();
    return 'connected';
  } catch {
    return 'not connected';
  }
}

export default connectDB;
