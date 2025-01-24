import React from 'react';

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useToast = () => {
  return {
    toast: jest.fn(),
  };
}; 