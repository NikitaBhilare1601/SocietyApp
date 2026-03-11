import React, { useState } from "react";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { Building2, Plus, Edit, Trash2, Home, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
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

interface Society {
  id: number;
  name: string;
  numberOfWings: number;
  whatsappNumber?: string;
  isWhatsApp?: number;
}

const Societies = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  let currentUser: any = {};
  let perms: string[] = [];
  let canEdit = false;

  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    perms = (currentUser.permissions || "").split(",");
    canEdit = perms.includes("all") || perms.includes("societies:edit") || perms.includes("societies");
  } catch (error) {
    console.error("Error parsing user data from localStorage in Societies.tsx:", error);
  }
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

  /* 🔹 API INTEGRATION */
  // Fetch Societies
  const fetchSocieties = async () => {
    try {
      const res = await fetch("/api/societies", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setSocieties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch societies:", error);
    }
  };

  React.useEffect(() => {
    fetchSocieties();
  }, []);

  React.useEffect(() => {
    if (sessionStorage.getItem("tourFlow") !== "societies") return;

    console.log("Societies Tour: Starting...");
    const addSocietyBtn = document.querySelector("[data-tour='society-add']");
    const menuWings = document.querySelector("[data-tour-id='menu-wings']");
    console.log("Societies Tour Elements:", {
      addSocietyBtn: !!addSocietyBtn,
      menuWings: !!menuWings,
      canEdit
    });

    // @ts-ignore
    const tour = introJs().setOptions({
      steps: [
        { element: "[data-tour='society-add']", intro: "Click here to add a new society. You'll need to enter the society name and number of wings." },
        { element: "[data-tour-id='menu-wings']", intro: "Step 2: Once you've added a society, go to the Wings page to configure the structure.", disableInteraction: false },
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

    // Use event delegation to handle clicks on the sidebar link, 
    // which might be re-rendered by Sidebar component updates
    const handleWingsClick = (e: any) => {
      if (e.target.closest("[data-tour-id='menu-wings']")) {
        console.log("Societies Tour: Menu Wings Clicked -> Setting tourFlow='wings'");
        sessionStorage.setItem("tourFlow", "wings");
      }
    };
    document.addEventListener("click", handleWingsClick, true);

    const handleExit = () => {
      console.log("Societies Tour: Exiting...");
      // Delay check slightly
      setTimeout(() => {
        if (sessionStorage.getItem("tourFlow") !== "wings") {
          console.log("Societies Tour: Clearing tourFlow (not proceeding to wings)");
          sessionStorage.removeItem("tourFlow");
        } else {
          console.log("Societies Tour: Proceeding to wings...");
        }
      }, 100);
    };

    tour.onexit(handleExit);
    tour.oncomplete(() => {
      console.log("Societies Tour: Completed! Navigating to Wings...");
      sessionStorage.setItem("tourFlow", "wings");
      navigate("/wings");
    });

    // Small delay to ensure Sidebar and DOM are fully ready
    setTimeout(() => {
      console.log("Societies Tour: calling start()");
      tour.start();
    }, 1000);

    return () => {
      document.removeEventListener("click", handleWingsClick, true);
      tour.exit(); // Force exit on unmount
    };
  }, []);

  const [societies, setSocieties] = useState<Society[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Society | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSociety, setEditingSociety] = useState<Society | null>(null);
  const [formData, setFormData] = useState({ name: "", numberOfWings: 1, whatsappNumber: "", isWhatsApp: false });
  const [deleteSociety, setDeleteSociety] = useState<Society | null>(null);

  const handleSort = (key: keyof Society) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Society) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-foreground" />;
    if (sortConfig.direction === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-foreground" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSociety) {
        // Update existing society
        const res = await fetch(`/api/societies/${editingSociety.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(formData),
        });
        if (res.ok) success("Society updated successfully");
        else toastError("Failed to update society");
      } else {
        // Add new society
        const res = await fetch("/api/societies", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(formData),
        });
        if (res.ok) success("Society added successfully");
        else toastError("Failed to add society");
      }

      fetchSocieties(); // Refresh list
      setIsDialogOpen(false);
      setEditingSociety(null);
      setFormData({ name: "", numberOfWings: 1, whatsappNumber: "", isWhatsApp: false });
    } catch (err) {
      console.error("Submit failed:", err);
      toastError("An error occurred. Please try again.");
    }
  };

  const handleEdit = (society: Society) => {
    setEditingSociety(society);
    setFormData({
      name: society.name,
      numberOfWings: society.numberOfWings,
      whatsappNumber: society.whatsappNumber || "",
      isWhatsApp: !!society.isWhatsApp
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteSociety) return;

    try {
      const res = await fetch(`/api/societies/${deleteSociety.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        success("Society deleted successfully");
        fetchSocieties(); // Refresh list
      } else {
        toastError("Failed to delete society");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toastError("An error occurred while deleting.");
    }
    setDeleteSociety(null);
  };


  const openAddDialog = () => {
    setEditingSociety(null);
    setFormData({ name: "", numberOfWings: 1, whatsappNumber: "", isWhatsApp: false });
    setIsDialogOpen(true);
  };

  const filteredSocieties = societies
    .filter((society) => {
      const globalMatch =
        society.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        society.id.toString().includes(searchQuery);

      return globalMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

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

  return (
    <Layout>
      <div className="bg-background min-h-full transition-colors">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Societies</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
          </div>
          {canEdit && (
            <Button
              onClick={openAddDialog}
              size="sm"
              className="shadow-lg shadow-primary/20"
              data-tour="society-add"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Society
            </Button>
          )}
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
              <div>
                <CardTitle className="text-base font-bold text-foreground">All Societies</CardTitle>
                <CardDescription className="text-muted-foreground">Manage your registered societies</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search societies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-muted/20 border-border transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider border-b border-border">
                      <th className="px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("id")}
                        >
                          <span>ID</span>
                          {getSortIcon("id")}
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("name")}
                        >
                          <span>Society Name</span>
                          {getSortIcon("name")}
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("numberOfWings")}
                        >
                          <span>Wings</span>
                          {getSortIcon("numberOfWings")}
                        </div>
                      </th>
                      <th className="px-6 py-3">WhatsApp Notification</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredSocieties.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                              <Building2 className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-bold text-foreground">
                              {searchQuery ? `No societies matching "${searchQuery}"` : "No societies added yet"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSocieties.map((society) => (
                        <tr key={society.id} className="hover:bg-accent/30 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                            #{society.id.toString().padStart(3, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {society.name.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{society.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="px-2.5 py-1 rounded-md bg-accent text-foreground text-xs font-bold border border-border/50">
                                {society.numberOfWings} Wings
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-muted-foreground">
                              {society.whatsappNumber || "Not Set"} {society.isWhatsApp === 1 && "(WhatsApp)"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleEdit(society)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteSociety(society)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
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

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl border border-border max-w-md w-full mx-4">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {editingSociety ? "Edit Society" : "Add New Society"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Society Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter society name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="wings">Number of Wings</Label>
                <Input
                  id="wings"
                  type="number"
                  min="1"
                  value={formData.numberOfWings}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfWings: parseInt(e.target.value) })
                  }
                  placeholder="Enter number of wings"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">Mobile Number</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Input
                    id="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="e.g. +918999375372"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      id="isWhatsApp"
                      checked={formData.isWhatsApp}
                      onChange={e => setFormData({ ...formData, isWhatsApp: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label htmlFor="isWhatsApp" className="cursor-pointer text-xs">WhatsApp?</Label>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Society alerts will go to this number if WhatsApp is checked.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSociety(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSociety ? "Update" : "Add"} Society
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AlertDialog
        open={!!deleteSociety}
        onOpenChange={() => setDeleteSociety(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Society</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteSociety?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
};

export default Societies;