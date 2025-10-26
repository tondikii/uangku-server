import { HttpStatus } from '@nestjs/common';

export function successResponse<T>(
  data: T,
  message = 'Success',
  statusCode: number = HttpStatus.OK,
) {
  return {
    statusCode,
    success: true,
    message,
    data,
  };
}
