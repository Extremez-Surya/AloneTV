'use client'

import { usePathname } from 'next/navigation'
import FilterSidebar from './FilterSidebar'

const catalogRoutes = ['/movies', '/tv', '/web-series', '/anime']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCatalog = catalogRoutes.some(r => pathname.startsWith(r))

  return (
    <>
      {isCatalog && <FilterSidebar />}
      <div className={isCatalog ? 'lg:pl-[220px]' : ''}>
        {children}
      </div>
    </>
  )
}
