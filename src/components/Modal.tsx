import type { ReactNode } from 'react';

export function Modal({
  title,
  children,
  onClose,
  wide,
  hideTitle,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  hideTitle?: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal${wide ? ' wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button type="button" className="modal-close no-print" onClick={onClose} aria-label="Close">
          ×
        </button>
        {!hideTitle && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
