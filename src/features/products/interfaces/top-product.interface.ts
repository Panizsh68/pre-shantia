export interface TopProduct {
  _id: string;
  name: string;
  sales: number;
  company?: {
    _id: string;
    name: string;
  };
}
