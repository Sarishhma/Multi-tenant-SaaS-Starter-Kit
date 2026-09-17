export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const badRequest = (message: string) => new AppError(message, 400);
export const unauthorized = (message: string) => new AppError(message, 401);
export const forbidden = (message: string) => new AppError(message, 403);
export const notFound = (message: string) => new AppError(message, 404);
export const conflict = (message: string) => new AppError(message, 409);
export const tooManyRequests = (message: string) => new AppError(message, 429);