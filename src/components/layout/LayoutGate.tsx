'use client'

import { usePathname } from 'next/navigation'

const playerRoutes = ['/watch/']

export default function LayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPlayer = playerRoutes.some(r => pathname.startsWith(r))

  if (isPlayer) return null

  return <>{children}</>
}
