import mongoose, { Document } from 'mongoose';

// ✅ TypeScript용 인터페이스 정의
export interface IUser extends Document {
  name: string;
  email: string;
  id: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ 스키마 정의
const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  id: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false
});

// ✅ 모델 export 시 타입 지정
export const User = mongoose.model<IUser>('User', userSchema);
