import { Outlet } from 'react-router-dom'

export function PrintLayout() {
  return (
    <div className="print-layout min-h-screen bg-white text-black p-8 print:p-0">
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break-after-always { page-break-after: always; break-after: page; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
      <Outlet />
    </div>
  )
}
