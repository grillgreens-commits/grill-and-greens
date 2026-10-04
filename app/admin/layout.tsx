'use client'

import { useEffect, useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-onesignal').then((module) => {
        const OneSignal = module.default;
        OneSignal.init({
          appId: "1c50777d-a313-47aa-b784-1b6df6694007",
          allowLocalhostAsSecureOrigin: true,
        }).then(() => {
          // إظهار الشريط فقط إذا لم يمنح المستخدم الإذن بعد
          if (Notification.permission !== 'granted') {
            setShowBanner(true);
          }
        }).catch((err) => {
          console.error('OneSignal Init Error:', err);
        });
      });
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined') {
      const OneSignal = (await import('react-onesignal')).default;
      await OneSignal.Notifications.requestPermission();
      if (Notification.permission === 'granted') {
        setShowBanner(false);
      }
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {showBanner && (
        <div style={{ background: '#3182ce', color: '#fff', padding: '10px', textAlign: 'center', fontSize: '14px' }}>
          🔔 لتلقي إشعارات الطلبات الجديدة فجأة والموقع مغلق: 
          <button 
            onClick={handleEnableNotifications}
            style={{ marginRight: '10px', padding: '4px 12px', background: '#fff', color: '#3182ce', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            تفعيل الإشعارات الآن
          </button>
        </div>
      )}
      {children}
    </div>
  );
}