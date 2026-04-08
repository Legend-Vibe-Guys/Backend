import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { swaggerSpec } from './swagger';

import indexRouter from './routes/index';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app: Express = express();

const allowedOrigins = [process.env.DEPLOY_URL, process.env.LOCAL_URL].filter(Boolean) as string[];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
