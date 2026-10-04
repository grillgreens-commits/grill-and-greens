'use client'

import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // استدعاء مكتبة OneSignal ديناميكياً لتجنب مشاكل Build
    import('react-onesignal').then((OneSignal) => {
      OneSignal.default.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
        allowLocalhostAsSecureOrigin: true,
      }).then(() => {
        // إظهار نافذة إذن الإشعارات
        OneSignal.default.Slidedown.promptPush()
      })
    })
  }, [])

  return (
    <div className="admin-layout-wrapper">
      {children}
    </div>
  )
}