const documents = [
  { number: 'IG-DEMO-DOC-001', name: 'Quality Manual', standard: 'ISO 9001', clause: '4-10', type: 'Manual', version: '2.1', status: 'Active' },
  { number: 'IG-DEMO-DOC-002', name: 'Document Control Procedure', standard: 'ISO 9001', clause: '7.5', type: 'Procedure', version: '1.3', status: 'Active' },
  { number: 'IG-DEMO-DOC-003', name: 'Internal Audit Procedure', standard: 'ISO 9001', clause: '9.2', type: 'Procedure', version: '1.0', status: 'Active' },
  { number: 'IG-DEMO-DOC-004', name: 'Risk Register', standard: 'ISO 9001 / 45001', clause: '6.1', type: 'Register', version: '3.2', status: 'Review due' },
  { number: 'IG-DEMO-DOC-005', name: 'Legal Register (OHS Act, COIDA, NEMA)', standard: 'ISO 14001 / 45001', clause: '6.1.3', type: 'Register', version: '2.0', status: 'Active' },
  { number: 'IG-DEMO-DOC-006', name: 'HIRA - Housekeeping', standard: 'ISO 45001', clause: '6.1.2', type: 'Assessment', version: '1.1', status: 'Active' },
]

const statusStyles = {
  'Active': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'Review due': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
}

const MockDocuments = () => {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Documents</h2>
          <p className="text-sm text-white/50 mt-1">Auto-numbered, version-controlled, audit-ready.</p>
        </div>
        <div className="flex gap-2">
          <button
            data-tour-step="4"
            type="button"
            className="px-4 py-2 text-sm font-semibold bg-white/5 border border-white/10 text-white/80 rounded-xl hover:bg-white/10 transition-all"
          >
            Export PDF
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl"
          >
            + New Document
          </button>
        </div>
      </div>

      <div data-tour-step="3" className="glass-card glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/50">
                <th className="py-3 px-4 font-semibold">Document #</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Standard / Clause</th>
                <th className="py-3 px-4 font-semibold hidden lg:table-cell">Type</th>
                <th className="py-3 px-4 font-semibold">Version</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d, i) => (
                <tr
                  key={d.number}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-300">{d.number}</td>
                  <td className="py-3 px-4 text-white font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-white/60 hidden md:table-cell">
                    <div className="text-xs">{d.standard}</div>
                    <div className="text-[11px] text-white/40">Cl. {d.clause}</div>
                  </td>
                  <td className="py-3 px-4 text-white/60 hidden lg:table-cell">{d.type}</td>
                  <td className="py-3 px-4 text-white/80">v{d.version}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusStyles[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default MockDocuments
