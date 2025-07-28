import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorhandler.middlewares.js';

const app = express();

app.use(cors({
    origin: process.env.CORS,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
}));

app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({extended: true, limit: '10kb'}))
app.use(express.static('public'))
app.use(cookieParser())

//import routes
import userRouter from './routes/user.routes.js';
import followRouter from './routes/follow.routes.js'
import postRouter from './routes/post.routes.js'
import searchRouter from './routes/search.routes.js'
import profileRouter from './routes/profile.routes.js'
import messageRouter from './routes/message.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1", followRouter)
app.use("/api/v1/post", postRouter)
app.use("/api/v1/search", searchRouter)
app.use("/api/v1/profile", profileRouter)
app.use("/api/v1/message", messageRouter)

app.use(errorHandler);

export default app;