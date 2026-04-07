import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vibe Guys API',
      version: '1.0.0',
      description: '백엔드 서버 API 명세서입니다.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '로컬 개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/healthy': {
        get: {
          summary: '서버 헬스체크',
          tags: ['System'],
          responses: {
            200: { description: 'OK' },
          },
        },
      },
      '/auth/signup': {
        post: {
          summary: '회원가입 및 정보 저장',
          description: '사용자 정보와 아이 정보를 각각 users, students 컬렉션에 저장합니다.',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    uid: { type: 'string', example: 'user_1234' },
                    name: { type: 'string', example: '본인 이름' },
                    role: { type: 'string', enum: ['teacher', 'parent'], example: 'parent' },
                    email: { type: 'string', example: 'example@email.com' },
                    phone: { type: 'string', example: '010-0000-0000' },
                    studentInfo: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: '아이 이름' },
                        birthDate: { type: 'string', example: '2020-01-01' },
                        allergy: { type: 'array', items: { type: 'string' }, example: ['우유'] },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: '회원가입 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: '로그인 및 유저 정보 조회',
          description: 'Firebase 토큰을 검증하여 가입된 유저 정보를 반환합니다.',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: '로그인 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { type: 'object' },
                    },
                  },
                },
              },
            },
            404: { description: '가입되지 않은 유저' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/index.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
