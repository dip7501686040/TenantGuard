import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { AuthenticatedRequest } from "../guards/jwt-auth.guard"

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
  const user = request.user

  return data ? user?.[data] : user
})

export const CurrentTenant = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
  const tenant = request.tenant

  return data ? tenant?.[data] : tenant
})
