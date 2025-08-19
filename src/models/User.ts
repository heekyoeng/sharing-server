// models/User.ts
import mongoose, { Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'USER';

export interface IUser {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  createdAt: Date;
}

type IUserDoc = mongoose.HydratedDocument<IUser>;
type IUserModel = mongoose.Model<IUser, {}, {}, {}, IUserDoc>; // ✅ 모델 제네릭 고정

const UserSchema = new Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, required: false, trim: true, lowercase: true,
      unique: true, sparse: true, index: true              // ✅ 있을 때만 유니크
    },
    username: { type: String, required: true, trim: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER', index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const r = ret as any;           // 🔒 transform 내부만 느슨하게
        if (!r.id && r._id) r.id = String(r._id);
        delete r._id;
        delete r.password;
        return r;
      },
    },
  }
);

// Hot-reload 안전 + 타입 유지
export const UserModel =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>('User', UserSchema);
