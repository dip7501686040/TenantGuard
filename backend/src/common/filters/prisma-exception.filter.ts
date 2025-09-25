import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from "@nestjs/common"
import { Response } from "express"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name)

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    this.logger.error(`Prisma error: ${exception.code} - ${exception.message}`, exception.stack)

    let status: HttpStatus
    let message: string

    switch (exception.code) {
      case "P2002":
        // Unique constraint failed
        status = HttpStatus.CONFLICT
        message = "Resource already exists"
        break
      case "P2025":
        // Record not found
        status = HttpStatus.NOT_FOUND
        message = "Resource not found"
        break
      case "P2003":
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST
        message = "Invalid reference to related resource"
        break
      case "P2016":
        // Query interpretation error
        status = HttpStatus.BAD_REQUEST
        message = "Invalid query parameters"
        break
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR
        message = "Database operation failed"
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      error: process.env.NODE_ENV === "development" ? exception.message : undefined
    })
  }
}
