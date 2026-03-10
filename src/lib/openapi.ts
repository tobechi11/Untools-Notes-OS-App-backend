const bearerSecurity = [{ BearerAuth: [] }];

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "AI Note Taker API",
    version: "0.3.0",
    description:
      "Structured decision memo API — Bun + Hono + Prisma + Postgres. Register via API docs, verify email with OTP, then login to get a Bearer token.",
  },
  servers: [{ url: "/api", description: "Local" }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Create account and send a 6-digit verification code to the email. Must call /auth/verify-email next.",
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
            description: "Created — verification code sent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Verify email with OTP",
        description:
          "Submit the 6-digit code received via email. Returns a JWT on success.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyEmailInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Email verified — JWT returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Invalid or expired code" },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend verification code",
        description: "Invalidates previous codes and sends a new 6-digit OTP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendVerificationInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description:
          "Authenticate with email + password. Email must be verified first.",
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
          "403": {
            description: "Email not verified (includes needsVerification flag)",
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset code",
        description:
          "Sends a 6-digit reset code to the email if the account exists.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK (always succeeds to prevent email enumeration)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        description: "Verify the reset code and set a new password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "400": { description: "Invalid or expired code" },
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
    "/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List all users",
        description:
          "Returns all users with their status, ID, email verification state, and memo/tag counts.",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UserListItem" },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/user/{id}": {
      delete: {
        tags: ["Auth"],
        summary: "Delete user by ID",
        description: "Permanently delete a user and all their data by user ID.",
        security: bearerSecurity,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User ID to delete",
          },
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "User not found" },
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
    "/tags/{name}": {
      delete: {
        tags: ["Tags"],
        summary: "Delete tag by name",
        description:
          "Deletes a tag and removes it from all memo associations. Does not modify memo content.",
        security: bearerSecurity,
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Tag name (URL-encoded)",
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                },
              },
            },
          },
          "404": { description: "Tag not found" },
        },
      },
    },
    "/seed": {
      post: {
        tags: ["System"],
        summary: "Seed sample data for all users (no auth)",
        description:
          "Creates 3 sample memos with structured nodes, tags, and metadata for every user in the database. Safe to call multiple times — each call adds new memos.",
        responses: {
          "200": {
            description: "Seed complete",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    users: { type: "integer" },
                    memos: { type: "integer" },
                    tags: { type: "integer" },
                    nodes: { type: "integer" },
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
    "/test-email": {
      post: {
        tags: ["System"],
        summary: "Test email delivery (no auth)",
        description:
          "Send a test email via Brevo to verify configuration. Returns the full Brevo API response for debugging.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to"],
                properties: {
                  to: {
                    type: "string",
                    format: "email",
                    example: "kunal@infrahive.ai",
                    description: "Recipient email — replace this entirely with your address",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Brevo response (check success field)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    brevoStatus: { type: "integer" },
                    brevoResponse: { type: "object" },
                    config: {
                      type: "object",
                      properties: {
                        senderEmail: { type: "string" },
                        senderName: { type: "string" },
                        apiKeySet: { type: "boolean" },
                        apiKeyPrefix: { type: "string" },
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
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: { type: "string", minLength: 6, example: "mypassword" },
          name: { type: "string", example: "Jane Doe" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "demo@example.com",
          },
          password: { type: "string", example: "demo1234" },
        },
      },
      VerifyEmailInput: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          code: {
            type: "string",
            example: "483921",
            description: "6-digit OTP from email",
          },
        },
      },
      ResendVerificationInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
        },
      },
      ForgotPasswordInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
        },
      },
      ResetPasswordInput: {
        type: "object",
        required: ["email", "code", "newPassword"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          code: {
            type: "string",
            example: "483921",
            description: "6-digit OTP from email",
          },
          newPassword: {
            type: "string",
            minLength: 6,
            example: "newpassword123",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT Bearer token" },
          user: { $ref: "#/components/schemas/UserProfile" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          email: {
            type: "string",
            format: "email",
            description: "Included on register",
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UserListItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          memoCount: { type: "integer" },
          tagCount: { type: "integer" },
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
