import { NextRequest, NextResponse } from 'next/server';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Civiwork Management API',
    version: '1.0.0',
    description: 'API for construction workforce and financial management system',
    contact: {
      name: 'API Support',
      email: 'support@civiwork.com'
    }
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session'
      }
    },
    schemas: {
      Worker: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx123456789' },
          fullName: { type: 'string', example: 'Nguyễn Văn A' },
          role: { 
            type: 'string', 
            enum: ['DOI_TRUONG', 'THO_XAY', 'THO_PHU', 'THUE_NGOAI'],
            example: 'THO_XAY'
          },
          dailyRateVnd: { type: 'integer', example: 420000 },
          monthlyAllowanceVnd: { type: 'integer', example: 0 },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateWorker: {
        type: 'object',
        required: ['fullName', 'role', 'dailyRateVnd', 'monthlyAllowanceVnd'],
        properties: {
          fullName: { type: 'string', example: 'Nguyễn Văn A' },
          role: { 
            type: 'string', 
            enum: ['DOI_TRUONG', 'THO_XAY', 'THO_PHU', 'THUE_NGOAI'],
            example: 'THO_XAY'
          },
          dailyRateVnd: { type: 'integer', minimum: 0, example: 420000 },
          monthlyAllowanceVnd: { type: 'integer', minimum: 0, example: 0 }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx123456789' },
          name: { type: 'string', example: 'Dự án xây dựng nhà A' },
          clientName: { type: 'string', example: 'Công ty ABC' },
          address: { type: 'string', example: '123 Đường ABC, Quận 1, TP.HCM' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string', example: 'Ghi chú dự án' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Attendance: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx123456789' },
          date: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', example: 'clx123456789' },
          workerId: { type: 'string', example: 'clx987654321' },
          dayFraction: { type: 'number', minimum: 0, maximum: 1, example: 1.0 },
          meal: { 
            type: 'string', 
            enum: ['FULL_DAY', 'HALF_DAY', 'NONE'],
            example: 'FULL_DAY'
          },
          notes: { type: 'string', example: 'Làm việc bình thường' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation Error' },
          details: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'fullName' },
                message: { type: 'string', example: 'Họ tên là bắt buộc' }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/workers': {
      get: {
        summary: 'Get all workers',
        description: 'Retrieve a list of all active workers',
        tags: ['Workers'],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Worker' }
                }
              }
            }
          },
          '429': {
            description: 'Too Many Requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new worker',
        description: 'Add a new worker to the system',
        tags: ['Workers'],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWorker' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Worker created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Worker' }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '429': {
            description: 'Too Many Requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/projects': {
      get: {
        summary: 'Get all projects',
        description: 'Retrieve a list of all projects',
        tags: ['Projects'],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Project' }
                }
              }
            }
          }
        }
      }
    },
    '/api/attendances': {
      get: {
        summary: 'Get all attendances',
        description: 'Retrieve a list of all attendance records',
        tags: ['Attendances'],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Attendance' }
                }
              }
            }
          }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Check the health status of the API',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    responseTime: { type: 'string', example: '45ms' },
                    database: {
                      type: 'object',
                      properties: {
                        connected: { type: 'boolean' },
                        stats: { type: 'object' }
                      }
                    },
                    cache: {
                      type: 'object',
                      properties: {
                        size: { type: 'integer' },
                        healthy: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          '503': {
            description: 'System is unhealthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'unhealthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Workers',
      description: 'Worker management operations'
    },
    {
      name: 'Projects',
      description: 'Project management operations'
    },
    {
      name: 'Attendances',
      description: 'Attendance tracking operations'
    },
    {
      name: 'System',
      description: 'System health and monitoring'
    }
  ]
};

export async function GET(request: NextRequest) {
  return NextResponse.json(swaggerDefinition, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
