'use client';

import { X } from 'lucide-react';
import * as React from 'react';

import { Toast, ToastProps } from '@core/ui/components/ui/toast';
import { useToast } from '@core/ui/hooks/use-toast';
import { cn } from '@core/shared/utils/ui';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
