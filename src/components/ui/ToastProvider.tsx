'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--bg-elevated)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--error)',
            secondary: 'white',
          },
        },
      }}
    />
  );
}
