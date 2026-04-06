import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

import indexRouter from './routes/index';

const app = express();

const corsOptions = {
  origin: ['https://vibe-guys.vercel.app', 'http://localhost:3003'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

export default app;
