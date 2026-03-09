const bearerSecurity = [{ BearerAuth: [] }];

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "AI Note Taker API",
    version: "0.2.0",
    description:
      "Structured decision memo API — Bun + Hono + Prisma + Postgres. Register via API docs, then use Bearer token for all protected routes.",
  },
  servers: [{ url: "/api", description: "Local" }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Create a new account. Returns a JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticate with email + password. Returns a JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/memos": {
      post: {
        tags: ["Memos"],
        summary: "Create a new memo",
        security: bearerSecurity,
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { id: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["Memos"],
        summary: "List memos",
        security: bearerSecurity,
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Search by title",
          },
          {
            name: "tags",
            in: "query",
            schema: { type: "string" },
            description: "Comma-separated tag names",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MemoListItem" },
                },
              },
            },
          },
        },
      },
    },
    "/memos/{id}": {
      get: {
        tags: ["Memos"],
        summary: "Get memo by ID",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MemoDetail" },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Memos"],
        summary: "Save memo (title, body, tags)",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SaveMemoInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Memos"],
        summary: "Delete memo",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
    },
    "/dashboard/nodes": {
      get: {
        tags: ["Dashboard"],
        summary: "List nodes with filters",
        security: bearerSecurity,
        parameters: [
          {
            name: "node_types",
            in: "query",
            schema: { type: "string" },
            description: "Comma-separated node types",
          },
          {
            name: "tags",
            in: "query",
            schema: { type: "string" },
            description: "Comma-separated tag names",
          },
          { name: "confidence", in: "query", schema: { type: "string" } },
          { name: "outcome", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/DashboardNode" },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/due": {
      get: {
        tags: ["Dashboard"],
        summary: "List memos due for review",
        security: bearerSecurity,
        parameters: [
          {
            name: "within_days",
            in: "query",
            schema: { type: "integer", default: 0 },
            description: "0 = overdue only",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MemoListItem" },
                },
              },
            },
          },
        },
      },
    },
    "/tags": {
      get: {
        tags: ["Tags"],
        summary: "List all tags",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Login or register first, then paste the token here.",
      },
    },
    schemas: {
      RegisterInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 6, example: "mypassword" },
          name: { type: "string", example: "Jane Doe" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "demo@example.com" },
          password: { type: "string", example: "demo1234" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT Bearer token" },
          user: { $ref: "#/components/schemas/UserProfile" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      MemoListItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          confidence: { type: "string", nullable: true },
          reviewDate: { type: "string", format: "date", nullable: true },
          outcome: { type: "string", nullable: true },
          updatedAt: { type: "string", format: "date-time" },
          reviewDue: { type: "boolean" },
        },
      },
      MemoDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          tiptapJson: {
            type: "object",
            description: "ProseMirror JSON document",
          },
          tags: { type: "array", items: { type: "string" } },
          confidence: { type: "string", nullable: true },
          reviewDate: { type: "string", format: "date", nullable: true },
          outcome: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SaveMemoInput: {
        type: "object",
        required: ["title", "tiptapJson", "tags"],
        properties: {
          title: { type: "string" },
          tiptapJson: {
            type: "object",
            description: "ProseMirror JSON document",
          },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      DashboardNode: {
        type: "object",
        properties: {
          nodeId: { type: "string", format: "uuid" },
          nodeType: { type: "string" },
          content: { type: "string" },
          position: { type: "integer" },
          memoId: { type: "string", format: "uuid" },
          memoTitle: { type: "string" },
          memoTags: { type: "array", items: { type: "string" } },
          confidence: { type: "string", nullable: true },
          reviewDate: { type: "string", format: "date", nullable: true },
          outcome: { type: "string", nullable: true },
        },
      },
    },
  },
};
