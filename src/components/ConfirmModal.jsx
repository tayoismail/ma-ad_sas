import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', loading = false, onConfirm, onCancel }) {
  if (!open) return null;

  const icons = {
    danger: { icon: AlertCircle, color: 'bg-red-500/10 text-red-500' },
    warning: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500' },
    success: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-500' },
  };
  const Icon = icons[variant]?.icon || AlertCircle;

  const btnColors = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <Card className="w-full max-w-sm p-6 bg-card shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${icons[variant]?.color} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button className={`flex-1 ${btnColors[variant]}`} onClick={onConfirm} disabled={loading}>
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
