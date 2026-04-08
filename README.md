# ⚙️ Vibe Guys - Backend

바이브가이즈 프로젝트의 백엔드 API 서버 저장소입니다.  
Firebase 연동과 효율적인 데이터 처리를 위해 Express 프레임워크를 기반으로 구축되었습니다.

## 🚀 주요 기술 스택

- **Framework**: Express 5
- **Language**: TypeScript 6
- **Database/Auth**: Firebase Admin SDK
- **Environment**: Dotenv
- **Documentation**: Swagger (UI & JSDoc)
- **Validation**: Express Validator

## 🛠️ 시작하기 (Installation)

1. **저장소 클론**
   ```bash
   git clone https://github.com/Legend-Vibe-Guys/Backend
   ```

2. **패키지 설치**
   ```bash
   pnpm install
   ```

3. **환경 변수 설정**
   프로젝트 루트에 `.env` 파일을 생성하고 `.env.sample`의 내용을 참고하여 필수 값을 입력합니다.
   ```bash
   cp .env.sample .env
   # .env 파일을 열어 필요한 설정을 입력하세요.
   ```

4. **로컬 개발 서버 실행**
   ```bash
   pnpm dev
   ```
   - 서버는 기본적으로 `PORT` 설정값(혹은 기본 포트)에서 실행됩니다.

## 📄 API 문서 (Swagger)

서버가 실행 중일 때, 다음 경로에서 API 문서를 확인할 수 있습니다:
- `http://localhost:<PORT>/api-docs` (기본 설정 시)
