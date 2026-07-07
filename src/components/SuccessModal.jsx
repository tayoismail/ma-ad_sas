import { useEffect, useRef } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function SuccessModal({ open, title, message, onClose, autoCloseMs }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (open && autoCloseMs) {
      timerRef.current = setTimeout(() => onClose?.(), autoCloseMs);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <Card className="w-full max-w-sm p-6 bg-card shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={onClose}>
          OK
        </Button>
      </Card>
    </div>
  );
}
