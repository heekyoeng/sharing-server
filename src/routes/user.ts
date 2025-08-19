// src/routes/user.routes.ts
import { Router } from 'express';
import {  getMe, getUsers, loginUser, logoutUser, registerUser } from '../controllers/user';


const userRouter = Router();
userRouter.post('/register', registerUser);
userRouter.post('/login',    loginUser);
userRouter.get('/',          getUsers);
userRouter.get('/me',        getMe);
// userRouter.post('/create',   createUser);
userRouter.post('/logout',   logoutUser);

export default userRouter;
