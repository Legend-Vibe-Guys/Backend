import dotenv from 'dotenv';
dotenv.config();
import './src/lib/firebase';
import app from './src/app';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 서버 가동 중: http://localhost:${port}`);
  console.log(`📝 API Docs: http://localhost:${port}/docs`);
});
