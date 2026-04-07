import { FileSpreadsheet, FileDown, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

/**
 * Export buttons for tables - PDF, Excel, Print
 */
export default function ExportButtons({ rows, columns, title, subtitle, filename, summaryCards, totalsRow, orientation, inHeader = false }) {
  const handlePDF = () => {
    exportToPDF({ rows, columns, title, subtitle, filename, summaryCards, totalsRow, orientation });
  };

  const handleExcel = () => {
    exportToExcel(rows, columns, filename, title);
  };

  const btnStyle = inHeader
    ? {
        base: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
        style: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' },
        hoverBg: 'rgba(255,255,255,0.18)',
        normalBg: 'rgba(255,255,255,0.1)',
      }
    : null;

  if (inHeader) {
    return (
      <>
        <button onClick={handlePDF}
          className={btnStyle.base}
          style={btnStyle.style}
          onMouseEnter={e => e.currentTarget.style.background = btnStyle.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = btnStyle.normalBg}>
          <FileDown size={14} /> PDF
        </button>
        <button onClick={handleExcel}
          className={btnStyle.base}
          style={btnStyle.style}
          onMouseEnter={e => e.currentTarget.style.background = btnStyle.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = btnStyle.normalBg}>
          <FileSpreadsheet size={14} /> Excel
        </button>
        <button onClick={() => window.print()}
          className={`${btnStyle.base} no-print`}
          style={btnStyle.style}
          onMouseEnter={e => e.currentTarget.style.background = btnStyle.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = btnStyle.normalBg}>
          <Printer size={14} />
        </button>
      </>
    );
  }

  return (
    <>
      <button onClick={handlePDF}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-red-50 text-red-700 hover:bg-red-100"
        style={{ border: '1px solid rgba(225,45,57,0.12)' }}>
        <FileDown size={15} /> PDF
      </button>
      <button onClick={handleExcel}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        style={{ border: '1px solid rgba(39,171,131,0.12)' }}>
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50 text-gray-600 hover:bg-gray-100 no-print"
        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <Printer size={15} /> طباعة
      </button>
    </>
  );
}
