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
    paths: {
      '/healthy': {
        get: {
          summary: '서버 헬스체크',
          description: '서버 및 기본 의존성(프로세스)이 살아있는지 확인합니다.',
          tags: ['System'],
          responses: {
            200: {
              description: '서버가 정상 동작 중일 때 반환됩니다.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'ok',
                      },
                      uptime: {
                        type: 'string',
                        example: '00:05:12',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // 나중에 다른 API가 추가되면 여기에 똑같이 객체로 이어서 적어주시면 됩니다.
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
