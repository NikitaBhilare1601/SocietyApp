import React, { useState, useEffect } from "react";
import { FileText, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ui/Toast";

interface Member {
  id: number;
  name: string;
  societyName: string;
  wingName: string;
  flatNumber: string;
  memberType: "Owner" | "Tenant";
  ownerName?: string;
  gender: string;
  mobileNumber: string;
  email: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

const Reports = () => {
  const { info } = useToast();
  const [members, setMembers] = useState<Member[]>([]);

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "x-user-role": user.roleName || "",
      "x-society-id": user.societyId?.toString() || "",
      "x-member-id": user.memberId?.toString() || "",
    };
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members", { headers: getAuthHeaders() });
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch data for reports:", error);
      }
    };
    fetchMembers();
  }, []);

  const reports = [
    {
      id: 1,
      title: "Society-wise Member Report",
      description: "Get detailed member information grouped by society",
    },
    {
      id: 2,
      title: "Wing-wise Occupancy Report",
      description: "View occupancy statistics for all wings",
    },
    {
      id: 3,
      title: "Vehicle Registration Report",
      description: "List of all registered vehicles in societies",
    },
    {
      id: 4,
      title: "Member Type Summary",
      description: "Summary of owners vs tenants across societies",
    },
  ];

  const generateCSV = (header: string[], data: (string | number)[][], filename: string) => {
    const csvContent = [
      header.join(","),
      ...data.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Add BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (reportTitle: string) => {
    if (members.length === 0) {
      info("No data available to export.");
      return;
    }

    switch (reportTitle) {
      case "Society-wise Member Report": {
        const header = ["ID", "Name", "Society", "Wing", "Flat", "Type", "Owner Name", "Gender", "Mobile", "Email", "Vehicle Number"];
        const data = members.map(m => [
          m.id,
          m.name,
          m.societyName,
          m.wingName,
          m.flatNumber,
          m.memberType,
          m.ownerName || "-",
          m.gender,
          m.mobileNumber,
          m.email,
          m.vehicleNumber || "-"
        ]);
        generateCSV(header, data, "Society_Members_Report");
        break;
      }

      case "Vehicle Registration Report": {
        const header = ["Vehicle Number", "Type", "Owner/Tenant Name", "Society", "Wing", "Flat", "Contact"];
        const vehicles = members.filter(m => m.vehicleNumber);

        if (vehicles.length === 0) {
          info("No vehicles registered.");
          return;
        }

        const data: (string | number)[][] = vehicles.map(m => [
          m.vehicleNumber || "",
          m.vehicleType || "Unknown",
          m.name,
          m.societyName,
          m.wingName,
          m.flatNumber,
          m.mobileNumber
        ]);
        generateCSV(header, data, "Vehicle_Report");
        break;
      }

      case "Member Type Summary": {
        const header = ["Society", "Total Owners", "Total Tenants", "Total Members"];
        const summary: Record<string, { owners: number, tenants: number }> = {};

        members.forEach(m => {
          if (!summary[m.societyName]) {
            summary[m.societyName] = { owners: 0, tenants: 0 };
          }
          const record = summary[m.societyName];
          if (record) { // TS Check
            if (m.memberType === "Owner") record.owners++;
            else record.tenants++;
          }
        });

        const data: (string | number)[][] = Object.keys(summary).map(society => {
          const stats = summary[society];
          if (!stats) return [society, 0, 0, 0];
          return [
            society,
            stats.owners,
            stats.tenants,
            stats.owners + stats.tenants
          ];
        });
        generateCSV(header, data, "Member_Type_Summary");
        break;
      }

      case "Wing-wise Occupancy Report": {
        const header = ["Society", "Wing", "Occupied Flats"];
        const occupancy: Record<string, number> = {};

        members.forEach(m => {
          const key = `${m.societyName} - ${m.wingName}`;
          occupancy[key] = (occupancy[key] || 0) + 1;
        });

        const data: (string | number)[][] = Object.keys(occupancy).map(key => {
          const parts = key.split(" - ");
          const society = parts[0] || "";
          const wing = parts[1] || "";
          return [society, wing, occupancy[key] || 0];
        });
        generateCSV(header, data, "Wing_Occupancy_Report");
        break;
      }
    }
  };

  return (
    <Layout>
      <div className="bg-background min-h-full transition-colors">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Reports & Analytics</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              <span>/</span>
              <span>Reports</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">{report.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(report.title)}
                      className="w-full shadow-lg shadow-primary/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel (CSV)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
