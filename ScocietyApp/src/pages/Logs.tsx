import React, { useEffect, useState } from "react";
import { Home, ScrollText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ui/Toast";

interface LogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  actorName: string | null;
  actorRole: string | null;
  societyId: number | null;
  created_at: string;
}

const Logs = () => {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LogEntry | "dateTime" | "entity" | "addedBy" | "role" | "name" | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const handleSort = (key: keyof LogEntry | "dateTime" | "entity" | "addedBy" | "role" | "name") => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof LogEntry | "dateTime" | "entity" | "addedBy" | "role" | "name") => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />;
    if (sortConfig.direction === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
  };

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "x-user-role": user.roleName || "",
      "x-society-id": user.societyId?.toString() || "",
      "x-member-id": user.memberId?.toString() || "",
    };
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/logs", { headers: getAuthHeaders() });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        toastError("Failed to fetch logs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (value: string) => {
    if (!value) return "";

    // Regex for standard SQL datetime "YYYY-MM-DD HH:MM:SS"
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);

    if (match) {
      const y = match[1];
      const m = match[2];
      const d = match[3];
      const h = match[4];
      const min = match[5];
      const s = match[6];

      if (y && m && d && h && min && s) {
        // Create a date object treating the input as UTC
        const utcDate = new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));

        // Format to IST using Intl.DateTimeFormat for maximum compatibility
        return new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false // User screenshot showed 24h format (11:07:41), keeping it consistent but correct
        }).format(utcDate);
      }
    }
    // Fallback for other formats
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(direct);
    }

    return value;
  };

  const formatEntity = (value: string) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const filteredLogs = logs
    .filter((log) => {
      const query = searchQuery.toLowerCase();
      const globalMatch =
        formatDate(log.created_at).toLowerCase().includes(query) ||
        (log.action === 'bulk_create' ? 'import' : log.action).toLowerCase().includes(query) ||
        formatEntity(log.entityType).toLowerCase().includes(query) ||
        (log.entityName || "").toLowerCase().includes(query) ||
        (log.actorName || "").toLowerCase().includes(query) ||
        (log.actorRole || "").toLowerCase().includes(query);

      return globalMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "dateTime":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "action":
          aValue = (a.action === 'bulk_create' ? 'import' : a.action).toLowerCase();
          bValue = (b.action === 'bulk_create' ? 'import' : b.action).toLowerCase();
          break;
        case "entity":
          aValue = formatEntity(a.entityType).toLowerCase();
          bValue = formatEntity(b.entityType).toLowerCase();
          break;
        case "name":
          aValue = (a.entityName || "").toLowerCase();
          bValue = (b.entityName || "").toLowerCase();
          break;
        case "addedBy":
          aValue = (a.actorName || "").toLowerCase();
          bValue = (b.actorName || "").toLowerCase();
          break;
        case "role":
          aValue = (a.actorRole || "").toLowerCase();
          bValue = (b.actorRole || "").toLowerCase();
          break;
        default:
          aValue = (a[sortConfig.key as keyof LogEntry] as any)?.toString().toLowerCase() || "";
          bValue = (b[sortConfig.key as keyof LogEntry] as any)?.toString().toLowerCase() || "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <Layout>
      <div className="bg-background min-h-full">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Audit Logs</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              <span>/</span>
              <span>Audit Logs</span>
            </div>
          </div>
          <ScrollText className="w-5 h-5 text-muted-foreground" />
        </header>

        <div className="p-4 md:p-8">
          <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">Recent Activity (IST)</CardTitle>
                <CardDescription className="text-muted-foreground">Track who added, edited, or deleted members, societies, and wings</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 bg-background border-border text-foreground transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("dateTime")}
                        >
                          <span>Date & Time</span>
                          {getSortIcon("dateTime")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("action")}
                        >
                          <span>Action</span>
                          {getSortIcon("action")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("entity")}
                        >
                          <span>Entity</span>
                          {getSortIcon("entity")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("name")}
                        >
                          <span>Name</span>
                          {getSortIcon("name")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("addedBy")}
                        >
                          <span>Performed By</span>
                          {getSortIcon("addedBy")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        <div
                          className="flex items-center cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort("role")}
                        >
                          <span>Role</span>
                          {getSortIcon("role")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">Loading logs...</td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">No logs found</td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                          <td className="p-4 text-muted-foreground group-hover:text-foreground transition-colors">{formatDate(log.created_at)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${log.action === 'create' || log.action === 'add' || log.action === 'bulk_create' || log.action === 'import' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                              log.action === 'delete' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' :
                                log.action === 'update' || log.action === 'edit' ? 'bg-sky-500/10 text-sky-500 hover:bg-sky-500/20' :
                                  'bg-muted text-muted-foreground'
                              }`}>
                              {(log.action === 'bulk_create' ? 'import' : log.action).toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-foreground font-semibold">{formatEntity(log.entityType)}</td>
                          <td className="p-4 text-foreground/80">{log.entityName || "-"}</td>
                          <td className="p-4 text-foreground/80">{log.actorName || "-"}</td>
                          <td className="p-4 text-muted-foreground">
                            <span className="px-2 py-0.5 rounded border border-border bg-muted/50 text-muted-foreground text-[10px] lowercase font-bold tracking-tight">
                              {log.actorRole || "-"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Logs;
