import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

export interface ModalConfig {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  defaultValue?: string;
  onConfirmPrompt?: (value: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--color-accent)' }} />;
      case 'warning':
        return <AlertCircle size={18} style={{ color: '#fbbf24' }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--color-secondary)' }} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'var(--color-success)';
      case 'error':
        return 'var(--color-accent)';
      case 'warning':
        return '#fbbf24';
      case 'info':
      default:
        return 'var(--color-secondary)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: 'rgba(21, 29, 48, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-thin)',
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        fontWeight: 500,
        pointerEvents: 'auto',
        animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        minWidth: '280px',
        maxWidth: '360px',
      }}
    >
      {getIcon()}
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          padding: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface CustomModalProps {
  config: ModalConfig;
  onClose: () => void;
}

export const CustomModal: React.FC<CustomModalProps> = ({ config, onClose }) => {
  const [inputValue, setInputValue] = React.useState('');

  useEffect(() => {
    if (config.isOpen) {
      setInputValue(config.defaultValue || '');
    }
  }, [config.isOpen, config.defaultValue]);

  if (!config.isOpen) return null;

  const handleConfirm = () => {
    if (config.type === 'prompt') {
      if (config.onConfirmPrompt) config.onConfirmPrompt(inputValue);
    } else {
      if (config.onConfirm) config.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(21, 29, 48, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 24px rgba(99, 102, 241, 0.1)',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {config.title}
        </h3>

        {/* Message */}
        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          {config.message}
        </p>

        {/* Input for prompts */}
        {config.type === 'prompt' && (
          <input
            type="text"
            className="form-input"
            style={{
              width: '100%',
              backgroundColor: 'rgba(5, 7, 12, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: '0.9rem',
              outline: 'none',
              marginTop: '4px',
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirm();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
          />
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
          }}
        >
          {(config.type === 'confirm' || config.type === 'prompt') && (
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              background:
                config.type === 'confirm' &&
                (config.title.toLowerCase().includes('eliminar') || config.title.toLowerCase().includes('vaciar'))
                  ? 'var(--color-accent)'
                  : undefined,
            }}
          >
            {config.type === 'confirm' || config.type === 'prompt' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};
