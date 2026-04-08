import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vibe Guys API',
      version: '1.0.0',
      description: '백엔드 서버 API 명세서입니다.',
    },
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
          description:
            '사용자 정보와 아이 정보를 각각 users, students 컬렉션에 저장합니다. UID는 인증 토큰에서 자동으로 추출하므로 본문에 포함하지 않습니다.',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: '본인 이름' },
                    role: { type: 'string', enum: ['teacher', 'parent'], example: 'parent' },
                    phone: { type: 'string', example: '010-0000-0000' },
                    studentInfo: {
                      type: 'object',
                      properties: {
                        kidsName: { type: 'string', example: '아이 이름' },
                        birthDate: { type: 'string', example: '2020-01-01' },
                        teacherName: { type: 'string', example: '김선생님' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: '회원가입 성공 (데이터 생성됨)',
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
            400: { description: '잘못된 요청 (필수값 누락 또는 유효성 검사 실패)' },
            409: { description: '이미 가입된 사용자' },
            500: { description: '서버 내부 오류' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: '로그인 및 유저 정보 조회',
          description:
            'Firebase 토큰을 검증하여 가입된 유저 정보를 반환합니다. 역할(role)이 teacher인 경우 담당 학생 목록(kids)이 포함됩니다.',
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
                      message: { type: 'string' },
                      user: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          name: { type: 'string' },
                          role: { type: 'string' },
                          phone: { type: 'string' },
                          createdAt: { type: 'string' },
                          kids: {
                            type: 'array',
                            description: '선생님(teacher) 역할일 때만 반환되는 학생 목록',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', description: '학생 문서 ID' },
                                kidsName: { type: 'string' },
                                birthDate: { type: 'string' },
                                teacherName: { type: 'string' },
                                parentUid: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: '유효하지 않거나 만료된 토큰' },
            404: { description: '가입되지 않은 유저 (회원가입 필요)' },
            500: { description: '서버 내부 오류' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
