import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportPreviewTableProps {
  data: any[];
}

const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const headers = data[0] ? Object.keys(data[0]).filter(header => header !== "Status") : [];

  if (headers.length === 0) return null;

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Scroll Instruction */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></span>
        </div>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          Scroll horizontally to see all data →
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/60 shadow-md">
        {/* Main scroll container - forcing visible scroll bar area and touch support */}
        <div 
          className="w-full overflow-x-scroll custom-scroller-forced pb-3" 
          style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Using a fixed massive width to FORCE the container to scroll */}
          <table className="border-collapse" style={{ width: '2000px', tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-muted/80 border-b-2 border-border">
                {headers.map((header) => (
                  <th 
                    key={header} 
                    className="h-14 px-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap text-left border-r border-border/20 last:border-0"
                    style={{ width: '180px' }} // Give each column a fixed minimum breathing room
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/40 last:border-0 hover:bg-blue-50/50 transition-colors">
                  {headers.map((header) => (
                    <td 
                      key={header} 
                      className="px-8 py-5 text-sm font-semibold whitespace-nowrap text-foreground border-r border-border/10 last:border-0"
                    >
                      {row[header] !== undefined && row[header] !== null && String(row[header]).trim() !== "" 
                        ? String(row[header]) 
                        : <span className="text-muted-foreground/30 font-normal italic">not set</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {data.length > 10 && (
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right px-4 italic opacity-70">
          Viewing preview · {data.length} total rows
        </p>
      )}

      {/* Force a highly contrasting, constantly visible scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scroller-forced::-webkit-scrollbar {
          height: 14px !important;
          width: 14px !important;
          background: #f1f5f9 !important;
          display: block !important;
        }
        .custom-scroller-forced::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 10px;
        }
        .custom-scroller-forced::-webkit-scrollbar-thumb {
          background-color: #3b82f6 !important;
          border-radius: 10px;
          border: 3px solid #f1f5f9;
        }
        .custom-scroller-forced::-webkit-scrollbar-thumb:hover {
          background-color: #1d4ed8 !important;
        }
        /* Keep it visible even when not hovered/scrolled */
        .custom-scroller-forced {
          scrollbar-width: auto !important;
          scrollbar-color: #3b82f6 #f1f5f9 !important;
        }
      `}} />
    </div>
  );
};









export default ImportPreviewTable;
