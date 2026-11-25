import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  // Escape closes the modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalhead">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
