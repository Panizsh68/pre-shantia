export interface AdvancedSearchParams {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  companyName?: string;
  categoryIds?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}
