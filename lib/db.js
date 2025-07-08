import mongoose from 'mongoose';

const connectMongo = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    return mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  }
};

export default connectMongo;
