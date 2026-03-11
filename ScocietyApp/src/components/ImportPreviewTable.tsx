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

  // Assuming the first object in the array contains all the keys for headers
  const headers = Object.keys(data[0]).filter(header => header !== "Status");

  return (
    <Card className="mt-6 border-none shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Import Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider border-b border-border">
                {headers.map((header) => (
                  <TableHead key={header} className="px-6 py-3">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30">
              {data.slice(0, 10).map((row, rowIndex) => ( // Limit to first 10 rows for preview
                <TableRow key={rowIndex} className="hover:bg-accent/30 transition-colors group">
                  {headers.map((header) => (
                    <TableCell key={header} className="px-6 py-4">
                      {String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4">
            Displaying first 10 rows of {data.length} total rows.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportPreviewTable;
