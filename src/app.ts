import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

import indexRouter from './routes/index';
import authRouter from './routes/auth';

const app: Express = express();

const corsOptions = {
  origin: ['https://vibe-guys.vercel.app', 'http://localhost:3003', 'http://127.0.0.1:5500'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);
app.use('/auth', authRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

export default app;
