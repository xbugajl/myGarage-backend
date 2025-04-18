const mongoose = require('mongoose');

console.table({
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS ? '***' : undefined,
  DB_NAME: process.env.DB_NAME,
  CLUSTER_HOST: process.env.CLUSTER_HOST,
});

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}` +
  `@${process.env.CLUSTER_HOST}/${process.env.DB_NAME}` +
  `?retryWrites=true&w=majority&appName=Cluster1`;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, { // URI na pripojenie na DB
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;