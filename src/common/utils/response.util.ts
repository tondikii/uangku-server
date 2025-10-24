export function successResponse(data: any, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(error: unknown, message = 'Error') {
  if (typeof error === 'string') {
    return { success: false, message: error };
  }

  if (error instanceof Error) {
    return { success: false, message: error.message };
  }

  return { success: false, message };
}
