export type JobStatus = 'scheduled' | 'en_route' | 'in_progress' | 'done' | 'cancelled';
export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type TechAvailability = 'available' | 'on_job' | 'off';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  color: string;
  availability: TechAvailability;
  skills: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  durationMinutes: number;
}

export interface LineItem {
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Job {
  id: string;
  number: string;
  customerId: string;
  technicianId: string | null;
  title: string;
  status: JobStatus;
  scheduledStart: string;
  scheduledEnd: string;
  lineItems: LineItem[];
  notes: string;
  estimateId?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface Estimate {
  id: string;
  number: string;
  customerId: string;
  status: EstimateStatus;
  lineItems: LineItem[];
  notes: string;
  validUntil: string;
  createdAt: string;
  jobId?: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  jobId?: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  notes: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface AppData {
  customers: Customer[];
  technicians: Technician[];
  services: ServiceItem[];
  jobs: Job[];
  estimates: Estimate[];
  invoices: Invoice[];
  seededAt: string;
}

export function lineTotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}
