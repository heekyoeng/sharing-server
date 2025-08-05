import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

export async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ 로컬 MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ 로컬 MongoDB 연결 실패:', error);
    process.exit(1);
  }
}
