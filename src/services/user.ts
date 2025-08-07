
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const handleLogin = async (id: string, password: string) => {
  const user = await User.findOne({ id: id });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('아이디 혹은 비밀번호가 틀렸습니다.');
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  });

  return { token, role: user.role };
};

export const handleCreateUser = async ({ name, email, id, password }: any) => {
  const existing = await User.findOne({ id });
  if (existing) throw new Error('이미 존재하는 ID');

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, id, password: hashed });
  return await newUser.save();
};

export const handleGetUsers = async () => {
  return await User.find();
};
