import dotenv from 'dotenv';
import app from './src/app';

dotenv.config();

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`🚀 서버 가동 중: http://localhost:${port}`);
  console.log(`📝 API Docs: http://localhost:${port}/api-docs`);
});
