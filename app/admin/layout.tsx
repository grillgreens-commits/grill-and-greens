'use client'

import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-onesignal').then((module) => {
        const OneSignal = module.default;
        OneSignal.init({
          appId: "1c50777d-a313-47aa-b784-1b6df6694007",
          allowLocalhostAsSecureOrigin: true,
        }).catch((err) => {
          console.error('OneSignal Init Error:', err);
        });
      });
    }
  }, []);

  return (
    <div className="admin-layout-wrapper">
      {children}
    </div>
  );
}