import { Company } from '../entities/company.entity';
import { ICompany } from './company.interface';

export interface ICompanyService {
  createCompany(companyData: Partial<Company>): Promise<ICompany>;
  updateCompany(id: string, updateData: Partial<Company>): Promise<ICompany>;
  deleteCompany(id: string): Promise<void>;
  getCompanyById(id: string): Promise<ICompany>;
  getAllCompanies(): Promise<ICompany[]>;
}
