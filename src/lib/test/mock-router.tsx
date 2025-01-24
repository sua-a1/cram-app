import React from 'react';
import { useRouter } from 'next/navigation';

type AppRouterInstance = ReturnType<typeof useRouter>;

const createAppRouterContext = (router: Partial<AppRouterInstance>) => {
  return {
    ...router,
    push: router.push ?? (() => Promise.resolve(true)),
    replace: router.replace ?? (() => Promise.resolve(true)),
    refresh: router.refresh ?? (() => {}),
    back: router.back ?? (() => {}),
    forward: router.forward ?? (() => {}),
    prefetch: router.prefetch ?? (() => Promise.resolve()),
  };
};

export const mockRouter = createAppRouterContext({
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => Promise.resolve(),
});

export const MockNextRouter = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-next-router">
      {children}
    </div>
  );
}; 
