"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
let PrismaExceptionFilter = PrismaExceptionFilter_1 = class PrismaExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(PrismaExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        this.logger.error(`Prisma error: ${exception.code} - ${exception.message}`, exception.stack);
        let status;
        let message;
        switch (exception.code) {
            case "P2002":
                status = common_1.HttpStatus.CONFLICT;
                message = "Resource already exists";
                break;
            case "P2025":
                status = common_1.HttpStatus.NOT_FOUND;
                message = "Resource not found";
                break;
            case "P2003":
                status = common_1.HttpStatus.BAD_REQUEST;
                message = "Invalid reference to related resource";
                break;
            case "P2016":
                status = common_1.HttpStatus.BAD_REQUEST;
                message = "Invalid query parameters";
                break;
            default:
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = "Database operation failed";
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message,
            error: process.env.NODE_ENV === "development" ? exception.message : undefined
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = PrismaExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(library_1.PrismaClientKnownRequestError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map