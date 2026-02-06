import { Response } from 'express';

interface ApiResponseOptions<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: ApiResponseOptions<T>['meta']
  ): Response {
    const response: ApiResponseOptions<T> = {
      success: true,
      message,
    };

    if (data !== undefined) {
      response.data = data;
    }

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return this.success(res, 201, message, data);
  }

  static ok<T>(
    res: Response,
    message: string,
    data?: T,
    meta?: ApiResponseOptions<T>['meta']
  ): Response {
    return this.success(res, 200, message, data, meta);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: any[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
