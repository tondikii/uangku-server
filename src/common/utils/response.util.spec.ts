import { successResponse, errorResponse } from './response.util';

describe('response.util', () => {
  describe('successResponse', () => {
    it('should return success true with default values', () => {
      const data = { name: 'Tondiki' };
      const result = successResponse(data);
      expect(result).toEqual({
        success: true,
        message: 'Success',
        data,
      });
    });

    it('should support custom message', () => {
      const data = { id: 1 };
      const result = successResponse(data, 'Created');
      expect(result).toEqual({
        success: true,
        message: 'Created',
        data,
      });
    });
  });

  describe('errorResponse', () => {
    it('should handle string error', () => {
      const result = errorResponse('Something went wrong');
      expect(result).toEqual({
        success: false,
        message: 'Something went wrong',
      });
    });

    it('should handle Error object', () => {
      const err = new Error('Invalid');
      const result = errorResponse(err);
      expect(result).toEqual({
        success: false,
        message: 'Invalid',
      });
    });

    it('should handle object without message', () => {
      const result = errorResponse({}, 'Fallback');
      expect(result).toEqual({
        success: false,
        message: 'Fallback',
      });
    });
  });
});
