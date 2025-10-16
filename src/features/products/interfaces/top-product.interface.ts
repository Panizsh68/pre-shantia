export interface TopProduct {
  id: string;
  name: string;
  avgRating: number;
  company?: {
    id: string;
    name: string;
  };
}
