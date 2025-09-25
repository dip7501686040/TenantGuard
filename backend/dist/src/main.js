"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger("Bootstrap");
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    app.enableCors({
        origin: process.env.WEB_BASE_URL || "http://localhost:3000",
        credentials: true
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle("TenantGuard API")
        .setDescription("Multi-tenant IAM system API documentation")
        .setVersion("1.0")
        .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header"
    }, "JWT-auth")
        .addTag("Authentication", "Authentication and authorization endpoints")
        .addTag("Tenants", "Tenant management endpoints")
        .addTag("Organizations", "Organization management endpoints")
        .addTag("Users", "User management endpoints")
        .addTag("Roles", "Role and permission management endpoints")
        .addTag("Identity Providers", "IdP configuration endpoints")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document, {
        swaggerOptions: {
            persistAuthorization: true
        }
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map