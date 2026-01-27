// src/components/print/InventoryChecklist.tsx

export function InventoryChecklist() {
  const items = [
    { category: 'Engine Components', part: 'Cat C15 Oil Filters', needed: 12 },
    { category: 'Marine Propulsion', part: 'TwinDisc Coupling', needed: 1 },
    { category: 'Hydraulic Systems', part: 'High Temp Seal Kit', needed: 2 },
    {
      category: 'Electrical Spares',
      part: 'Voltage Regulator (Cat)',
      needed: 3,
    },
    { category: 'Filtration', part: 'Racor Fuel Filter Element', needed: 20 },
    { category: 'Gaskets & Seals', part: 'Manifold Gasket Set', needed: 4 },
    { category: '', part: '', needed: null }, // Blank line
    { category: '', part: '', needed: null }, // Blank line
  ]

  return (
    <div className="h-screen flex flex-col p-4">
      <header className="mb-6 border-b-2 border-black pb-2 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-wider">
          Critical Inventory Lookahead
        </h1>
        <p className="text-sm font-medium text-gray-600">
          Verify items for next week's production
        </p>
      </header>

      <div className="mt-4">
        <table className="w-full border-collapse border border-black text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2 w-1/5">Category</th>
              <th className="border border-black p-2 w-1/4">Critical Part</th>
              <th className="border border-black p-2 w-1/12">Qty Needs</th>
              <th className="border border-black p-2 w-1/12 text-red-600">
                On Hand
              </th>
              <th className="border border-black p-2">Action Required</th>
              <th className="border border-black p-2 w-1/12">Verified</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="h-16">
                <td className="border border-black p-2 font-medium bg-gray-50">
                  {item.category}
                </td>
                <td className="border border-black p-2 font-bold">
                  {item.part}
                </td>
                <td className="border border-black p-2 text-center text-lg">
                  {item.needed}
                </td>
                <td className="border border-black p-2 relative">
                  {/* User write area */}
                  <div className="absolute top-1 left-1 text-[8px] text-gray-400">
                    COUNT:
                  </div>
                </td>
                <td className="border border-black p-2 relative">
                  {/* User write area */}
                  <div className="absolute top-1 left-1 text-[8px] text-gray-400">
                    NOTES:
                  </div>
                </td>
                <td className="border border-black p-2 relative">
                  <div className="w-6 h-6 border-2 border-black rounded mx-auto mt-1"></div>
                </td>
              </tr>
            ))}
            {/* Extra blank rows */}
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={`blank-${i}`} className="h-16">
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 relative">
                  <div className="w-6 h-6 border-2 border-black rounded mx-auto mt-1"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
