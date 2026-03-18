console.log("Import.tsx file is being executed!");

import React, { useState } from "react";
import { Download, Upload, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ImportPreviewTable from "../components/ImportPreviewTable";
import { Home } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/Toast";

const Import = () => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dataToImport, setDataToImport] = useState<any[] | null>(null);
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");



  const clearPreview = () => {
    setPreviewData(null);
    setShowPreview(false);
    setDataToImport(null); // Clear data to import as well
  };

  const handleDownloadSample = () => {
    const headers = [
      "Society",
      "Wing",
      "Flat",
      "Member Name",
      "Owner Name",
      "Type",
      "Gender",
      "Mobile",
      "Email",
      "Vehicle Type",
      "Vehicle Number"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample_Import_Template");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sample_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      console.log("File upload started.");
      const reader = new FileReader();

      reader.onload = async (e) => {
        console.log("FileReader onload event triggered.");
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          console.log("File data read as ArrayBuffer.");
          const workbook = XLSX.read(data, { type: 'array' });
          console.log("Workbook parsed.");
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            toastError("Import Failed: No sheets found in the workbook.");
            setLoading(false);
            return;
          }
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            toastError("Import Failed: Worksheet not found.");
            setLoading(false);
            return;
          }
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          console.log("Sheet converted to JSON:", json);

          if (json.length === 0) {
            toastError("Import Failed: The uploaded file is empty.");
            setLoading(false);
            console.log("File is empty.");
            return;
          }

          const headers = json[0] as string[];
          const rows = json.slice(1) as any[][];
          console.log("Headers and rows extracted.");

          const mappedData = rows.map(row => {
            const rowData: { [key: string]: string | number | undefined } = {};
            headers.forEach((header, index) => {
              const val = row[index];
              const trimmedHeader = header.trim();
              rowData[trimmedHeader] = (val !== undefined && val !== null) ? val : "";
            });

            return rowData;
          });
          console.log("Data mapped:", mappedData);

          // Helper to get value case-insensitively
          const getValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key];
              const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== "") return row[foundKey];
            }
            return undefined;
          };

          // Transform data to match backend schema and apply conditional logic
          const processedData = mappedData.map(row => {
            console.log("Row Data:", row);
            const memberType = String(getValue(row, ["Type", "Member Type"]) || "Owner").toLowerCase();
            const ownerName = memberType === "tenant"
              ? getValue(row, ["Owner Name", "Owner"])
              : getValue(row, ["Member Name", "MemberName", "Name", "Member"]);

            return {
              name: getValue(row, ["Member Name", "MemberName", "Name", "Member"]),
              societyId: user.societyId || undefined,
              societyName: getValue(row, ["Society", "Society Name"]) || user.societyName || "",
              wingName: getValue(row, ["Wing", "Wing Name"]),
              flatNumber: getValue(row, ["Flat", "Flat Number", "Flat No"]),
              memberType: getValue(row, ["Type", "Member Type"]),
              ownerName: ownerName,
              gender: getValue(row, ["Gender", "Sex"]),
              mobileNumber: getValue(row, ["Mobile", "Mobile Number", "Contact"]),
              email: getValue(row, ["Email", "Email Address"]),
              vehicleType: getValue(row, ["Vehicle Type"]),
              vehicleNumber: getValue(row, ["Vehicle Number", "Vehicle No"]),
              // idProof is not in Excel, will be null or handled by backend
            };
          });
          console.log("Processed Data:", processedData);

          const csvHeaders = [
            "name", "societyId", "societyName", "wingName", "flatNumber", "memberType", "ownerName",
            "gender", "mobileNumber", "email", "vehicleType", "vehicleNumber"
          ];

          setPreviewData(mappedData); // Use mappedData for preview
          setShowPreview(true);
          setDataToImport(processedData); // Store processedData for saving
        } catch (error: any) {
          toastError(error.message || "An unexpected error occurred.");
          console.error("Import error caught in catch block:", error);
        } finally {
          setLoading(false);
          console.log("File upload process finished.");
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };



  const handleSave = async () => {
    if (!dataToImport || dataToImport.length === 0) {
      toastError("No data to save. Please upload a file first.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");


      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-user-role": user.roleName || "",
        "x-society-id": user.societyId?.toString() || "",
        "x-member-id": user.memberId?.toString() || "",
        "x-user-id": user.id?.toString() || "",
        "x-user-name": user.fullName || user.email || "",
      };
      console.log("Headers being sent with fetch (direct):", headers);

      const response = await fetch("/api/members/bulk-create", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(dataToImport),
      });

      const result = await response.json();
      console.log("[Import] Server response:", result);

      if (response.ok && result.success) {
        if (result.failed > 0) {
          const firstError = result.errors && result.errors.length > 0 ? result.errors[0] : "Check member details for mandatory fields.";
          toastError(`Partial Success: ${result.successful} saved, ${result.failed} failed. ${firstError}`);
        } else {
          success(result.message || "Data saved successfully! Redirecting to members tab...");
        }
        
        // Even on partial success, we clear and navigate because data was saved
        clearPreview();
        setTimeout(() => navigate("/members"), 1500);
      } else {
        toastError(result.message || "Failed to save data.");
        console.error("Save failed with server error:", result);
      }
    } catch (error: any) {
      toastError(error.message || "An unexpected error occurred during save.");
      console.error("Save error caught in catch block:", error);
    } finally {
      setLoading(false);
    }

  };

  return (
    <Layout>
      <div className="bg-background min-h-full transition-colors">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Import Data</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              <span>/</span>
              <span>Import</span>
            </div>
          </div>
          <ScrollText className="w-5 h-5 text-primary" />
        </header>
        <div className="p-4 md:p-8">
          <Card className="w-full max-w-7xl mx-auto bg-card border-border shadow-md">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Import Members Data
              </CardTitle>
              <CardDescription className="text-muted-foreground">Upload an Excel or CSV file to import member information accurately into the system.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-32">
              <div className="flex flex-col w-full gap-8 overflow-x-hidden">

                {/* ... existing steps ... */}
                <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    Step 1: Download Template
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">Use our standardized template to ensure your data is formatted correctly before uploading.</p>
                  <Button onClick={handleDownloadSample} className="w-full sm:w-fit shadow-lg shadow-primary/20">
                    <Download className="mr-2 h-4 w-4" /> Download Sample Template
                  </Button>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Step 2: Upload Your File
                  </h3>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-2">
                    Supported formats: .xlsx, .xls, .csv
                  </label>
                  <div className="relative group">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-muted-foreground
                                file:mr-4 file:py-2.5 file:px-6
                                file:rounded-lg file:border-0
                                file:text-sm file:font-bold
                                file:bg-primary file:text-primary-foreground
                                hover:file:bg-primary/90
                                file:cursor-pointer
                                cursor-pointer
                                border border-border rounded-lg p-1.5 bg-background/50
                                group-hover:border-primary/50 transition-all duration-300"
                      disabled={loading}
                    />
                  </div>
                  {loading && (
                    <div className="mt-4 flex items-center gap-3 text-primary animate-pulse">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium">Processing file, please wait...</p>
                    </div>
                  )}
                </div>

                {showPreview && previewData && (
                  <div className="mt-8 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Data Preview (First 10 rows)</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {dataToImport?.length} Rows Found
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={clearPreview} disabled={loading} className="h-9">
                          Clear
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={loading || !dataToImport} className="h-9 shadow-lg shadow-primary/20 min-w-[100px]">
                          {loading ? "Saving..." : "Save Data"}
                        </Button>
                      </div>
                    </div>
                    
                    <ImportPreviewTable data={previewData} />

                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
                      <Button variant="outline" onClick={clearPreview} disabled={loading} className="border-border">
                        Clear Preview
                      </Button>
                      <Button onClick={handleSave} disabled={loading || !dataToImport} className="shadow-lg shadow-primary/20 min-w-[120px]">
                        {loading ? "Saving..." : "Save Data"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Import;



