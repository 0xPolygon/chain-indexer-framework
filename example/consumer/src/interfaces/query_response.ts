export interface IQueryResponse<T> {
  result: T | T[],
  paginationData?: {
    hasNextPage: boolean,
    page: number,
    pageSize: number,
    totalCount: number,
  }
}
