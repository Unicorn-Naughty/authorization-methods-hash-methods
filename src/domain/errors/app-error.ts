export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
