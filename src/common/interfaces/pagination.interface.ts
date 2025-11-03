export interface FindAllOptions {
  page: number;
  limit: number;
  transactionTypeId?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
