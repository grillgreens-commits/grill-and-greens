'use client'

import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // التأكد من التشغيل داخل المتصفح فقط
    if (typeof window !== 'undefined') {
      import('react-onesignal').then((module) => {
        const OneSignal = module.default;
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          allowLocalhostAsSecureOrigin: true,
        }).then(() => {
          // طلب إذن الإشعارات
          OneSignal.Slidedown.promptPush();
        }).catch((err) => {
          console.error('OneSignal Init Error:', err);
        });
      });
    }
  }, []);

  return <div className="admin-layout-wrapper">{children}</div>;
}