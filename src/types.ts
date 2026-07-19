export interface Apartment {
  id: string;
  name: string;
  address: string;
  icon?: string;
  currency?: string;
  targetRent?: string | number;
  size?: string | number;
  pricePerSqm?: string | number;
  taxableRent?: string | number;
  taxPercent?: string | number;
  startDate?: string;
  contractEnd?: string;
  status?: 'landlord' | 'tenant';
  displayOrder?: string | number;
  rentSegments?: RentSegment[];
  isCpiLinked?: boolean | string;
  baseRentAmount?: number | string;
  baseCpiMonth?: string | number;
  baseCpiYear?: string | number;
}

export interface CpiIndex {
  id: string;
  year: number;
  month: number;
  value: number;
  publishedAt?: string;
  indexType?: 'cpi' | 'construction';
}

export interface RentSegment {
  fromMonth: number;
  toMonth: number;
  amount: number;
}

export interface Payment {
  id: string;
  aptId: string;
  amount: number | string;
  date: string;
  notes?: string;
}

export interface Repair {
  id: string;
  aptId: string;
  type: string;
  providerName?: string;
  date: string;
  cost: number | string;
  actualPaymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  notes?: string;
}

export interface Tenant {
  id: string;
  name: string;
  aptId: string;
  aptName?: string;
  entryDate?: string;
  phone?: string;
  notes?: string;
}

export interface TenantHistory {
  id: string;
  name: string;
  aptId: string;
  aptName?: string;
  entryDate?: string;
  exitDate?: string;
  phone?: string;
  notes?: string;
  archivedAt?: string;
}

export interface Neighbor {
  id: string;
  name: string;
  aptId: string;
  aptName?: string;
  floor?: string | number;
  isCommittee?: string; // "true" or "false"
  phone?: string;
  spousePhone?: string;
  notes?: string;
}

export interface Mortgage {
  id: string;
  aptId: string;
  aptName?: string;
  bank: string;
  originalAmount?: number | string;
  interestRate?: number | string;
  drawdownDate?: string;
  durationYears?: number | string;
  balance?: number | string;
  balanceDate?: string;
  payment?: number | string;
  paymentDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  insurancePhone?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  aptId: string;
  type: string;
  amount: number | string;
  isPaid?: string; // "true" or "false"
  monthFrom?: string;
  monthTo?: string;
  meterFrom?: string;
  meterTo?: string;
  month?: string;
  paymentDate?: string;
  actualPaymentDate?: string;
  paymentMethod?: string;
  grossAmount?: number | string;
  discountPercent?: number | string;
  securityLevy?: number | string;
  mortgageId?: string;
  newBalance?: number | string;
  newBalanceDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface Inventory {
  id: string;
  aptId: string;
  type: string;
  modelDetails?: string;
  purchaseDate?: string;
  cost?: number | string;
  store?: string;
  serviceName?: string;
  servicePhone?: string;
  notes?: string;
}

export interface RecurringBudget {
  id: string;
  aptId: string;
  aptName: string;
  category: string;
  amount: number | string;
  freqMonths: string;
  startMonth: string;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  aptId: string;
  title: string;
  category: 'contract' | 'insurance' | 'receipt' | 'other';
  date: string;
  url?: string;
  storagePath?: string;
  notes?: string;
  fileName?: string;
  fileSize?: number;
  textCopy?: string; // Truly file-less pasted/written copy
  createdAt?: any;
  updatedAt?: any;
}

