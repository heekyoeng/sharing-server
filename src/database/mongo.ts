import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient, Db, Collection } from 'mongodb';
import { ENV } from '../env';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

export async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅MongoDB Atlas 연결 성공');
  } catch (error) {
    console.error('❌MongoDB Atlas 연결 실패:', error);
    process.exit(1);
  }
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(ENV.MONGO_URI); // 연결 실패해도 예외 전파
  await client.connect();
  db = client.db(ENV.MONGO_DB);
  return db;
}

export async function getCollection<T extends mongoose.mongo.BSON.Document>(name: string): Promise<Collection<T>> {
  const database = await getDb();
  return database.collection<T>(name);
}