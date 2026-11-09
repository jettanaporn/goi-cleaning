import { useEffect, useState } from 'react';
import {
  availabilityLabel,
  estimateStatusLabel,
  invoiceStatusLabel,
  jobStatusLabel,
} from '../lib/format';
import type {
  EstimateStatus,
  InvoiceStatus,
  JobStatus,
  TechAvailability,
} from '../types';

type Props =
  | { kind: 'job'; status: JobStatus }
  | { kind: 'estimate'; status: EstimateStatus }
  | { kind: 'invoice'; status: InvoiceStatus }
  | { kind: 'availability'; status: TechAvailability };

export function StatusBadge(props: Props) {
  const [pop, setPop] = useState(false);
  const key = `${props.kind}-${props.status}`;

  useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 350);
    return () => clearTimeout(t);
  }, [key]);

  const label =
    props.kind === 'job'
      ? jobStatusLabel[props.status]
      : props.kind === 'estimate'
        ? estimateStatusLabel[props.status]
        : props.kind === 'invoice'
          ? invoiceStatusLabel[props.status]
          : availabilityLabel[props.status];

  return (
    <span className={`badge badge-${props.status}${pop ? ' status-pop' : ''}`}>
      {label}
    </span>
  );
}
