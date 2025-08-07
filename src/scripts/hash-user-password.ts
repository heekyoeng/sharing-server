import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  console.log('📡 Connecting to MongoDB...');

  if (!process.env.MONGO_URI) {
    console.error('❌ .env 파일에 MONGO_URI가 정의되어 있지 않습니다.');
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB 연결 성공');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ DB 접근 실패');
    return;
  }

  const user = await db.collection('users').findOne({ id: 'hk' });
  console.log('🔍 사용자 조회 결과:', user);

  if (!user) {
    console.log('❌ 사용자 없음');
    return;
  }

  const hashed = await bcrypt.hash('123', 10);
  await db.collection('users').updateOne({ id: 'hk' }, { $set: { password: hashed } });
  console.log('✅ 비밀번호 해시 저장 완료');

  await mongoose.disconnect();
  console.log('📴 MongoDB 연결 종료');
};

run().catch((err) => {
  console.error('❗ 오류 발생:', err);
});
