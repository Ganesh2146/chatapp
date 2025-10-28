import mongoose from 'mongoose'

const connectdb = async () => {
  try {
    console.log('MONGO_DB_URI:', process.env.MONGO_DB_URI); // 👈 add here

    await mongoose.connect(process.env.MONGO_DB_URI, {
      dbName: 'chat_app', // optional if not in URI
    });

    console.log('Connected to mongodb successfully');
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

export default connectdb;
