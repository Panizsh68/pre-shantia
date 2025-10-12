export interface SearchProductParams {
  maxPrice?: number;
  maxFinalPrice?: number;  // For searching by final price (after discount)
  companyName?: string;
}