import React, { useState } from "react";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { Plus, Trash2, Home, Upload, X, Pencil, Eye, ArrowUpDown, ArrowUp, ArrowDown, Download, Users, Search, Edit2, Building2, Phone, Mail, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "../components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import Layout from "../components/Layout";

interface Society {
  id: number;
  name: string;
  whatsappNumber?: string;
  isWhatsApp?: number;
}

interface Member {
  id: number;
  name: string;
  societyId: number;
  societyName: string;
  wingName: string;
  flatNumber: string;
  memberType: "Owner" | "Tenant" | "System User";
  roleType: "Society Member" | "System User";
  ownerName?: string;
  gender: string;
  mobileNumber: string;
  email: string;
  vehicleType?: string;
  vehicleNumber?: string;
  status?: string;
  documents?: string;
  canRead?: number;
  canEdit?: number;
  canDelete?: number;
  idProof?: File | null;
}

const Members = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = currentUser.roleName;
  const isAdmin = role === "Super Admin" || role === "Society Admin";
  const perms = (currentUser.permissions || "").split(",");
  const canEdit = perms.includes("all") || perms.includes("members:edit") || perms.includes("members");
  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "x-user-role": user.roleName || "",
      "x-society-id": user.societyId?.toString() || "",
      "x-member-id": user.memberId?.toString() || "",
      "x-user-id": user.id?.toString() || "",
      "x-user-name": user.fullName || user.email || "",
    };
  };

  /* 🔹 EXISTING SOCIETIES (later replace with API) */
  const [societies, setSocieties] = useState<Society[]>([]);

  /* 🔹 API INTEGRATION */
  const fetchSocieties = async () => {
    try {
      const res = await fetch("/api/societies", { headers: getAuthHeaders() });
      const data = await res.json();
      setSocieties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch societies:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members", { headers: getAuthHeaders() });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json") ? (await res.json())?.message : await res.text();
        toastError(msg || "Failed to fetch members");
        return;
      }
      const data = await res.json();
      console.log("Fetched members data:", data);
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  React.useEffect(() => {
    fetchSocieties();
    fetchMembers();
  }, []);

  React.useEffect(() => {
    if (sessionStorage.getItem("tourFlow") !== "members") return;

    console.log("Members Tour: Starting...");
    const addMemberBtn = document.querySelector("[data-tour='members-add']");
    const approveBtn = document.querySelector("[data-tour='members-approve']");
    const menuDashboard = document.querySelector("[data-tour-id='menu-dashboard']");
    console.log("Members Tour Elements:", {
      addMemberBtn: !!addMemberBtn,
      approveBtn: !!approveBtn,
      menuDashboard: !!menuDashboard
    });

    // @ts-ignore
    const tour = introJs().setOptions({
      steps: [
        { intro: "Step 3: This is the final step. Here you can register members (Owners or Tenants) and link them to the Societies and Wings you created." },
        { element: "[data-tour='members-add']", intro: "Click here to add a new member. You'll need to select the Society, Wing, and Flat Number." },
        { element: "[data-tour='members-approve']", intro: "If a member registers themselves, a Society Admin can approve them here." },
        { element: "[data-tour-id='menu-dashboard']", intro: "Great job! You've completed the setup flow. Click here to go back to the Dashboard and see your updated total counts for Societies, Wings, and Members.", disableInteraction: false }
      ].filter(step => !step.element || document.querySelector(step.element)),
      showProgress: true,
      showBullets: false,
      overlayOpacity: 0.55,
      scrollToElement: true,
      nextLabel: "Next",
      prevLabel: "Back",
      doneLabel: "Finish",
      disableInteraction: true,
    });

    const handleExit = () => {
      console.log("Members Tour: Finished. Clearing tourFlow.");
      sessionStorage.removeItem("tourFlow");
      // Optional: Redirect to Dashboard if they click Finish on the last step?
      // The last step tells them to click the Dashboard link.
    };

    tour.onexit(handleExit);
    tour.oncomplete(() => {
      console.log("Members Tour: Completed! Navigating to Dashboard...");
      sessionStorage.removeItem("tourFlow");
      navigate("/dashboard");
    });

    // Small delay to ensure Sidebar and DOM are fully ready
    setTimeout(() => {
      console.log("Members Tour: calling start()");
      tour.start();
    }, 1000);

    return () => {
      tour.exit();
    };
  }, []);

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Member | "residence" | "contact" | "vehicle" | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const isSocietyAdmin = currentUser.roleName === "Society Admin" || currentUser.roleName === "Super Admin";

  const handleSort = (key: keyof Member | "residence" | "contact" | "vehicle") => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Member | "residence" | "contact" | "vehicle") => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-muted-foreground" />;
    if (sortConfig.direction === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
  };

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [formData, setFormData] = useState<Partial<Member>>({
    name: "",
    societyId: undefined,
    wingName: "",
    flatNumber: "",
    memberType: "Owner",
    roleType: "Society Member",
    gender: "Male",
    mobileNumber: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allWings, setAllWings] = useState<any[]>([]);
  const [availableWings, setAvailableWings] = useState<any[]>([]);
  const [availableFlats, setAvailableFlats] = useState<string[]>([]);

  const fetchWings = async () => {
    try {
      const res = await fetch("/api/wings", { headers: getAuthHeaders() });
      const data = await res.json();
      setAllWings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch wings:", error);
    }
  };

  React.useEffect(() => {
    fetchSocieties();
    fetchMembers();
    fetchWings();
  }, []);

  React.useEffect(() => {
    if (formData.societyId) {
      const filteredWings = allWings.filter(w => w.societyId === formData.societyId);
      setAvailableWings(filteredWings);

      // If the current wing is not in the filtered list, clear it
      if (formData.wingName && !filteredWings.find(w => w.wingName === formData.wingName)) {
        setFormData(prev => ({ ...prev, wingName: "", flatNumber: "" }));
      }
    } else {
      setAvailableWings([]);
      setAvailableFlats([]);
    }
  }, [formData.societyId, allWings]);

  React.useEffect(() => {
    if (formData.wingName && availableWings.length > 0) {
      const selectedWing = availableWings.find(w => w.wingName === formData.wingName);
      if (selectedWing) {
        const flats = selectedWing.flats.split(",").map((f: string) => f.trim()).filter((f: string) => f);
        setAvailableFlats(flats);

        // If the current flat number is not in the list, clear it
        if (formData.flatNumber && !flats.includes(formData.flatNumber)) {
          setFormData(prev => ({ ...prev, flatNumber: "" }));
        }
      }
    } else {
      setAvailableFlats([]);
    }
  }, [formData.wingName, availableWings]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const alphaSpace = /^[A-Za-z ]+$/;
    const alphaNumSpace = /^[A-Za-z0-9 ]+$/;
    const emailRx = /^\S+@\S+\.\S+$/;
    const mobileRx = /^[6-9]\d{9}$/;
    const vehicleRx = /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{0,3}[ -]?\d{4}$/;

    if (!formData.name?.trim()) newErrors.name = "Name is required";
    else if (!alphaSpace.test(formData.name.trim())) newErrors.name = "Only letters and spaces allowed";

    if (!formData.societyId) newErrors.societyId = "Society is required";

    if (formData.memberType !== "System User") {
      if (!formData.wingName?.trim()) newErrors.wingName = "Wing is required";
      if (!formData.flatNumber?.trim()) newErrors.flatNumber = "Flat Number is required";
    }

    if (!formData.vehicleType?.trim()) newErrors.vehicleType = "Vehicle Type is required";
    if (!formData.vehicleNumber?.trim()) newErrors.vehicleNumber = "Vehicle Number is required";

    if (formData.memberType === "Tenant") {
      if (!formData.ownerName?.trim()) newErrors.ownerName = "Owner name is required";
      else if (!alphaSpace.test(formData.ownerName.trim())) newErrors.ownerName = "Only letters and spaces allowed";
    }

    if (!mobileRx.test(formData.mobileNumber || "")) newErrors.mobileNumber = "Enter valid 10-digit mobile starting 6-9";

    if (formData.email && !emailRx.test(formData.email)) newErrors.email = "Enter valid email address";

    if (formData.vehicleType && !alphaNumSpace.test(formData.vehicleType.trim())) newErrors.vehicleType = "Only letters and numbers allowed";

    if (formData.vehicleNumber) {
      const vn = (formData.vehicleNumber || "").toUpperCase();
      if (!vehicleRx.test(vn)) newErrors.vehicleNumber = "Invalid format (e.g. MH 01 AB 1234)";
    }

    if (!formData.idProof && !formData.documents) newErrors.idProof = "Document upload is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = new FormData();
    data.append("name", formData.name || "");
    data.append("societyId", formData.societyId?.toString() || "");
    data.append("societyName", societies.find(s => s.id === formData.societyId)?.name || "");
    data.append("wingName", formData.wingName || "");
    data.append("flatNumber", formData.flatNumber || "");
    data.append("memberType", formData.memberType || "Owner");

    // Set roleType based on memberType
    const roleType = formData.memberType === "System User" ? "System User" : "Society Member";
    data.append("roleType", roleType);
    data.append("ownerName", formData.ownerName || "");
    data.append("gender", formData.gender || "Male");
    data.append("mobileNumber", formData.mobileNumber || "");
    data.append("email", formData.email || "");
    data.append("vehicleType", formData.vehicleType || "");
    data.append("vehicleNumber", formData.vehicleNumber || "");

    if (formData.idProof) {
      data.append("document", formData.idProof);
    }

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/members/${editingId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: data,
        });
        if (res.ok) {
          success("Member updated successfully");
        } else {
          const ct = res.headers.get("content-type") || "";
          const msg = ct.includes("application/json") ? (await res.json())?.message : await res.text();
          toastError(msg || "Failed to update member");
        }
      } else {
        // Create new
        const res = await fetch("/api/members", {
          method: "POST",
          headers: getAuthHeaders(),
          body: data,
        });
        if (res.ok) {
          success("Member added successfully");
        } else {
          const ct = res.headers.get("content-type") || "";
          const msg = ct.includes("application/json") ? (await res.json())?.message : await res.text();
          toastError(msg || "Failed to add member");
        }
      }

      fetchMembers(); // Refresh list
      setIsDialogOpen(false);
      setFormData({});
      setEditingId(null);
      setErrors({});
    } catch (err) {
      console.error("Submit failed:", err);
      toastError("An error occurred during save.");
    }
  };

  const handleApprove = async (member: Member) => {
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: "Active" })
      });

      if (res.ok) {
        success("Member approved successfully");
        fetchMembers();
      } else {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json") ? (await res.json())?.message : await res.text();
        toastError(msg || "Failed to approve member");
      }
    } catch (err) {
      console.error("Approval failed:", err);
      toastError("An error occurred during approval.");
    }
  };

  const handleEdit = (member: Member) => {
    setEditingId(member.id);
    setFormData(member);
    setIsDialogOpen(true);
  };

  const handleDelete = (member: Member) => {
    setDeleteMember(member);
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;
    try {
      const res = await fetch(`/api/members/${deleteMember.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        success("Member deleted successfully");
        fetchMembers();
      } else {
        toastError("Failed to delete member");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toastError("An error occurred during deletion.");
    }
    setDeleteMember(null);
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      success("No members found matching current filters.");
      return;
    }

    const header = [
      "Society", "Wing", "Flat", "Member Name", "Role", "Type", "Gender", "Mobile", "Email", "Vehicle Type", "Vehicle Number", "Status"
    ];

    const rows: (string | number)[][] = filteredMembers.map(m => [
      m.societyName,
      m.wingName,
      m.flatNumber,
      m.name,
      m.roleType || "Society Member",
      m.memberType,
      m.gender,
      m.mobileNumber,
      m.email,
      m.vehicleType || "",
      m.vehicleNumber || "",
      m.status || "Pending"
    ]);

    const csvContent = [
      header.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Members_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Members exported to CSV");
  };

  const filteredMembers = members
    .filter((member) => {
      const query = searchQuery.toLowerCase();
      const globalMatch =
        member.name.toLowerCase().includes(query) ||
        member.wingName.toLowerCase().includes(query) ||
        member.flatNumber.toLowerCase().includes(query) ||
        member.mobileNumber.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.societyName.toLowerCase().includes(query);

      return globalMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue: any;
      let bValue: any;

      if (sortConfig.key === "residence") {
        aValue = `${a.societyName} ${a.wingName} ${a.flatNumber}`.toLowerCase();
        bValue = `${b.societyName} ${b.wingName} ${b.flatNumber}`.toLowerCase();
      } else if (sortConfig.key === "contact") {
        aValue = `${a.mobileNumber} ${a.email}`.toLowerCase();
        bValue = `${b.mobileNumber} ${b.email}`.toLowerCase();
      } else if (sortConfig.key === "vehicle") {
        aValue = `${a.vehicleType || ""} ${a.vehicleNumber || ""}`.toLowerCase();
        bValue = `${b.vehicleType || ""} ${b.vehicleNumber || ""}`.toLowerCase();
      } else {
        aValue = a[sortConfig.key as keyof Member];
        bValue = b[sortConfig.key as keyof Member];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const updateMemberAccess = async (memberId: number, nextAccess: { canRead: boolean; canEdit: boolean; canDelete: boolean }) => {
    try {
      const res = await fetch(`/api/members/${memberId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(nextAccess),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...data } : m));
        success("Access updated");
      } else {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json") ? (await res.json())?.message : await res.text();
        toastError(msg || "Failed to update access");
      }
    } catch (err) {
      console.error("Access update failed:", err);
      toastError("An error occurred while updating access.");
    }
  };


  return (
    <Layout>
      <div className="bg-background min-h-full">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Members</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
              {filteredMembers.length} Total
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="text-muted-foreground border-border"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {currentUser.roleName !== "Member" && canEdit && (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    memberType: "Owner",
                    gender: "Male",
                    status: "Pending"
                  });
                  setErrors({});
                  setIsDialogOpen(true);
                }}
                size="sm"
                data-tour="members-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        </header>

        <div className="p-8">
          <Card className="border-border shadow-sm bg-card">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
              <h3 className="font-bold text-foreground">Member List</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-10 h-9 bg-card border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-border mx-0 md:mx-6 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                    <TableHead className="w-[80px] pl-6 font-semibold text-muted-foreground hidden md:table-cell">Sr.No</TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      Member Details {getSortIcon("name")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort("residence")}
                    >
                      Society & Location {getSortIcon("residence")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort("contact")}
                    >
                      Contact Info {getSortIcon("contact")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground hidden lg:table-cell"
                      onClick={() => handleSort("vehicle")}
                    >
                      Vehicle Details {getSortIcon("vehicle")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort("memberType")}
                    >
                      Type {getSortIcon("memberType")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort("status")}
                    >
                      Status {getSortIcon("status")}
                    </TableHead>
                    <TableHead className="text-right pr-6 font-semibold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMembers.map((member, index) => (
                    <TableRow key={member.id} className="border-border hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium text-muted-foreground hidden md:table-cell">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground">{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.roleType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">{member.societyName}</span>
                          <span className="text-xs text-muted-foreground">{member.wingName} - {member.flatNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" /> {member.mobileNumber}
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" /> {member.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          {member.vehicleType ? (
                            <span className="text-sm text-foreground font-medium">{member.vehicleType}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {member.vehicleNumber && (
                            <span className="text-xs text-muted-foreground uppercase">{member.vehicleNumber}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          member.memberType === "Owner"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : member.memberType === "Tenant"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : "bg-muted text-muted-foreground border-border"
                        }>
                          {member.memberType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          member.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }>
                          {member.status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && member.status !== 'Active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 font-bold text-[10px]"
                              onClick={() => handleApprove(member)}
                              data-tour="members-approve"
                            >
                              Approve
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {member.documents && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-accent"
                              onClick={() => setDocUrl(member.documents || null)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {canEdit && currentUser.roleName !== "Member" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(member)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {currentMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                            <Users className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm font-medium text-foreground">No members found</p>
                          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredMembers.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Showing <strong>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> members
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 🔹 ADD MEMBER MODAL */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-4xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-8 pt-6 pb-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingId ? "Edit Member" : "Add New Member"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Fill in the details below to {editingId ? "update" : "register"} a member.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingId(null);
                    setFormData({});
                    setErrors({});
                  }}
                  className="rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="px-8 pt-4 pb-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Member Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Member Type</Label>
                    <select
                      className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={formData.memberType}
                      onChange={(e) => {
                        const type = e.target.value as "Owner" | "Tenant" | "System User";
                        const newData: any = { ...formData, memberType: type };
                        if (type === "System User") {
                          newData.wingName = "";
                          newData.flatNumber = "";
                          newData.ownerName = "";
                        }
                        setFormData(newData);
                      }}
                    >
                      <option value="Owner">Owner</option>
                      <option value="Tenant">Tenant</option>
                      <option value="System User">System User (View Only)</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, " ");
                        setFormData({ ...formData, name: value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="e.g. John Doe"
                      className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                    />
                    {errors.name && <p className="text-destructive text-[10px] font-bold">{errors.name}</p>}
                  </div>

                  {/* Society */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Society *</Label>
                    <select
                      className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={formData.societyId || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, societyId: Number(e.target.value) });
                        if (errors.societyId) setErrors({ ...errors, societyId: "" });
                      }}
                    >
                      <option value="">Select society</option>
                      {societies.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.societyId && <p className="text-destructive text-[10px] font-bold">{errors.societyId}</p>}
                  </div>

                  {/* Wing */}
                  {formData.memberType !== "System User" && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Wing *</Label>
                      <select
                        className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground disabled:bg-muted disabled:text-muted-foreground"
                        value={formData.wingName || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, wingName: e.target.value });
                          if (errors.wingName) setErrors({ ...errors, wingName: "" });
                        }}
                        disabled={!formData.societyId}
                      >
                        <option value="">Select Wing</option>
                        {availableWings.map((w) => (
                          <option key={w.id} value={w.wingName}>{w.wingName}</option>
                        ))}
                      </select>
                      {errors.wingName && <p className="text-destructive text-[10px] font-bold">{errors.wingName}</p>}
                    </div>
                  )}

                  {/* Flat */}
                  {formData.memberType !== "System User" && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Flat Number *</Label>
                      <select
                        className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground disabled:bg-muted disabled:text-muted-foreground"
                        value={formData.flatNumber || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, flatNumber: e.target.value });
                          if (errors.flatNumber) setErrors({ ...errors, flatNumber: "" });
                        }}
                        disabled={!formData.wingName}
                      >
                        <option value="">Select Flat</option>
                        {availableFlats.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      {errors.flatNumber && <p className="text-destructive text-[10px] font-bold">{errors.flatNumber}</p>}
                    </div>
                  )}

                  {/* Owner Name (conditional) */}
                  {formData.memberType === "Tenant" && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Owner Name *</Label>
                      <Input
                        value={formData.ownerName || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^A-Za-z\s]/g, " ");
                          setFormData({ ...formData, ownerName: value });
                          if (errors.ownerName) setErrors({ ...errors, ownerName: "" });
                        }}
                        placeholder="Owner's full name"
                        className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                      />
                      {errors.ownerName && <p className="text-destructive text-[10px] font-bold">{errors.ownerName}</p>}
                    </div>
                  )}

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gender</Label>
                    <select
                      className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number *</Label>
                    <Input
                      value={formData.mobileNumber || ""}
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, mobileNumber: value });
                        if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: "" });
                      }}
                      placeholder="10-digit number"
                      className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                    />
                    {errors.mobileNumber && <p className="text-destructive text-[10px] font-bold">{errors.mobileNumber}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                    <Input
                      value={formData.email || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder="john@example.com"
                      className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                    />
                    {errors.email && <p className="text-destructive text-[10px] font-bold">{errors.email}</p>}
                  </div>

                  {/* Vehicle Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Type *</Label>
                    <Input
                      value={formData.vehicleType || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9\s]/g, " ");
                        setFormData({ ...formData, vehicleType: value });
                        if (errors.vehicleType) setErrors({ ...errors, vehicleType: "" });
                      }}
                      placeholder="e.g. Car, Bike"
                      className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                    />
                    {errors.vehicleType && <p className="text-destructive text-[10px] font-bold">{errors.vehicleType}</p>}
                  </div>

                  {/* Vehicle Number */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Number *</Label>
                    <Input
                      value={formData.vehicleNumber || ""}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, "");
                        setFormData({ ...formData, vehicleNumber: value });
                        if (errors.vehicleNumber) setErrors({ ...errors, vehicleNumber: "" });
                      }}
                      placeholder="MH 01 AB 1234"
                      className="h-10 border-border focus:ring-primary/20 focus:border-primary rounded-lg bg-card"
                    />
                    {errors.vehicleNumber && <p className="text-destructive text-[10px] font-bold">{errors.vehicleNumber}</p>}
                  </div>

                  {/* ID Proof */}
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">ID Proof / Documents *</Label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-xl hover:border-primary transition-colors bg-muted/20 group">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        <div className="flex text-sm text-muted-foreground">
                          <label className="relative cursor-pointer bg-transparent rounded-md font-bold text-primary hover:text-primary/80 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setFormData({ ...formData, idProof: file });
                                if (file && errors.idProof) {
                                  const { idProof, ...rest } = errors;
                                  setErrors(rest);
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-tight">PNG, JPG, PDF up to 10MB</p>
                        {formData.idProof && (
                          <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center justify-center gap-1">
                            Selected: {formData.idProof.name}
                          </p>
                        )}
                        {formData.documents && !formData.idProof && (
                          <p className="text-[11px] font-bold text-primary mt-2">
                            Existing: {formData.documents.split('/').pop()}
                          </p>
                        )}
                      </div>
                    </div>
                    {errors.idProof && <p className="text-destructive text-[10px] font-bold">{errors.idProof}</p>}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingId(null);
                    setFormData({});
                    setErrors({});
                  }}
                  className="h-10 px-6 text-xs font-bold border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-8 text-xs font-bold shadow-lg shadow-primary/20"
                >
                  {editingId ? "Update Member" : "Save Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {docUrl && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" onContextMenu={(e) => e.preventDefault()}>
          <div className="bg-card rounded-lg border border-border w-[1000px] h-[85vh] relative overflow-hidden select-none">
            <button
              type="button"
              onClick={() => setDocUrl(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="h-full w-full">
              {(() => {
                const url = docUrl || "";
                const isPdf = /\.pdf(\?|#|$)/i.test(url);
                const isImage = /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url);
                if (isPdf) {
                  const viewerUrl = `${url}#toolbar=0&navpanes=0&view=FitH`;
                  return <iframe src={viewerUrl} className="w-full h-full" />;
                }
                if (isImage) {
                  return <img src={url} alt="Document" className="w-full h-full object-contain pointer-events-none" />;
                }
                return <iframe src={url} className="w-full h-full" />;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 🔹 DELETE ALERT DIALOG */}
      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">{deleteMember?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Members;