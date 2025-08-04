export interface ICompany {
  name: string;
  address?: string;
  phone?: string;
  email: string;
  registrationNumber: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
