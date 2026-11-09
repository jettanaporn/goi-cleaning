import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeedData } from '../data/seed';
import type {
  AppData,
  Customer,
  Invoice,
  Job,
  JobStatus,
  ServiceItem,
  Technician,
} from '../types';

/** Bumped so estimate-free / cleaning-only seed loads fresh. */
const STORAGE_KEY = 'goi-cleaning-app-v3';
const LEGACY_STORAGE_KEY = 'cleanpro-app-v1';

type Store = {
  data: AppData;
  resetDemo: () => void;
  upsertCustomer: (c: Customer) => void;
  upsertJob: (j: Job) => void;
  assignJob: (jobId: string, technicianId: string | null) => void;
  setJobStatus: (jobId: string, status: JobStatus) => void;
  upsertInvoice: (i: Invoice) => void;
  markInvoicePaid: (invoiceId: string) => void;
  createInvoiceFromJob: (jobId: string) => Invoice | null;
  upsertService: (s: ServiceItem) => void;
  upsertTechnician: (t: Technician) => void;
};

const StoreContext = createContext<Store | null>(null);

function load(): AppData {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed?.customers?.length && Array.isArray(parsed.jobs)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, estimates: undefined }));
        if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        return {
          customers: parsed.customers,
          technicians: parsed.technicians ?? [],
          services: parsed.services ?? [],
          jobs: parsed.jobs,
          invoices: parsed.invoices ?? [],
          seededAt: parsed.seededAt ?? new Date().toISOString(),
        };
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  const seed = createSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const resetDemo = useCallback(() => {
    const seed = createSeedData();
    setData(seed);
  }, []);

  const upsertCustomer = useCallback((c: Customer) => {
    setData((d) => {
      const i = d.customers.findIndex((x) => x.id === c.id);
      const customers = [...d.customers];
      if (i >= 0) customers[i] = c;
      else customers.unshift(c);
      return { ...d, customers };
    });
  }, []);

  const upsertJob = useCallback((j: Job) => {
    setData((d) => {
      const i = d.jobs.findIndex((x) => x.id === j.id);
      const jobs = [...d.jobs];
      if (i >= 0) jobs[i] = j;
      else jobs.unshift(j);
      const technicians = d.technicians.map((t) => {
        if (j.technicianId === t.id && (j.status === 'en_route' || j.status === 'in_progress')) {
          return { ...t, availability: 'on_job' as const };
        }
        return t;
      });
      return { ...d, jobs, technicians };
    });
  }, []);

  const assignJob = useCallback((jobId: string, technicianId: string | null) => {
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) => (j.id === jobId ? { ...j, technicianId } : j)),
    }));
  }, []);

  const setJobStatus = useCallback((jobId: string, status: JobStatus) => {
    setData((d) => {
      const jobs = d.jobs.map((j) => (j.id === jobId ? { ...j, status } : j));
      const job = jobs.find((j) => j.id === jobId);
      let technicians = d.technicians;
      if (job?.technicianId) {
        const onActive = jobs.some(
          (j) =>
            j.technicianId === job.technicianId &&
            (j.status === 'en_route' || j.status === 'in_progress'),
        );
        technicians = d.technicians.map((t) =>
          t.id === job.technicianId
            ? { ...t, availability: onActive ? 'on_job' : t.availability === 'off' ? 'off' : 'available' }
            : t,
        );
      }
      return { ...d, jobs, technicians };
    });
  }, []);

  const upsertInvoice = useCallback((i: Invoice) => {
    setData((d) => {
      const idx = d.invoices.findIndex((x) => x.id === i.id);
      const invoices = [...d.invoices];
      if (idx >= 0) invoices[idx] = i;
      else invoices.unshift(i);
      return { ...d, invoices };
    });
  }, []);

  const markInvoicePaid = useCallback((invoiceId: string) => {
    setData((d) => ({
      ...d,
      invoices: d.invoices.map((i) =>
        i.id === invoiceId
          ? { ...i, status: 'paid', paidAt: new Date().toISOString() }
          : i,
      ),
    }));
  }, []);

  const createInvoiceFromJob = useCallback((jobId: string): Invoice | null => {
    let created: Invoice | null = null;
    setData((d) => {
      const job = d.jobs.find((j) => j.id === jobId);
      if (!job) return d;
      const maxNum = Math.max(
        ...d.invoices.map((i) => parseInt(i.number.replace(/\D/g, ''), 10) || 0),
        800,
      );
      const inv: Invoice = {
        id: `inv-${Math.random().toString(36).slice(2, 9)}`,
        number: `INV-${maxNum + 1}`,
        customerId: job.customerId,
        jobId: job.id,
        status: 'draft',
        lineItems: job.lineItems,
        notes: '',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      created = inv;
      return {
        ...d,
        invoices: [inv, ...d.invoices],
        jobs: d.jobs.map((j) => (j.id === jobId ? { ...j, invoiceId: inv.id } : j)),
      };
    });
    return created;
  }, []);

  const upsertService = useCallback((s: ServiceItem) => {
    setData((d) => {
      const i = d.services.findIndex((x) => x.id === s.id);
      const services = [...d.services];
      if (i >= 0) services[i] = s;
      else services.push(s);
      return { ...d, services };
    });
  }, []);

  const upsertTechnician = useCallback((t: Technician) => {
    setData((d) => {
      const i = d.technicians.findIndex((x) => x.id === t.id);
      const technicians = [...d.technicians];
      if (i >= 0) technicians[i] = t;
      else technicians.push(t);
      return { ...d, technicians };
    });
  }, []);

  const value = useMemo(
    () => ({
      data,
      resetDemo,
      upsertCustomer,
      upsertJob,
      assignJob,
      setJobStatus,
      upsertInvoice,
      markInvoicePaid,
      createInvoiceFromJob,
      upsertService,
      upsertTechnician,
    }),
    [
      data,
      resetDemo,
      upsertCustomer,
      upsertJob,
      assignJob,
      setJobStatus,
      upsertInvoice,
      markInvoicePaid,
      createInvoiceFromJob,
      upsertService,
      upsertTechnician,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
