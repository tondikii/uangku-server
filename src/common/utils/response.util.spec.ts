import { successResponse } from './response.util';
import { HttpStatus } from '@nestjs/common';

describe('response.util', () => {
  describe('successResponse', () => {
    it('should return default success response', () => {
      const data = { foo: 'bar' };
      const res = successResponse(data);

      expect(res).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Success',
        data,
      });
    });

    it('should return custom message and statusCode', () => {
      const data = { id: 1 };
      const res = successResponse(data, 'Created', HttpStatus.CREATED);

      expect(res.statusCode).toBe(HttpStatus.CREATED);
      expect(res.message).toBe('Created');
    });
  });
});
