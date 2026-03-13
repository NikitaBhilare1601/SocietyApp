import React, { useState, useEffect } from "react";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { Layers, Home, Building2, ArrowUpDown, ArrowUp, ArrowDown, Search, Plus, Edit2, Trash2 } from "lucide-react";
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

const Wings = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const perms = (currentUser.permissions || "").split(",");
  const canEdit = perms.includes("all") || perms.includes("wings:edit") || perms.includes("wings") || perms.includes("societies");
  const [wings, setWings] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWing, setEditingWing] = useState<any>(null);
  const [formData, setFormData] = useState({ societyId: "", wingName: "", flats: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wingToDelete, setWingToDelete] = useState<any>(null);
  const [genFloors, setGenFloors] = useState("");
  const [genFlatsPerFloor, setGenFlatsPerFloor] = useState("");
  const [genSample, setGenSample] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: "society" | "wing" | "flats" | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const handleSort = (key: "society" | "wing" | "flats") => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: "society" | "wing" | "flats") => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-foreground" />;
    if (sortConfig.direction === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-foreground" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = user.roleName === "Super Admin";

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user.roleName || "",
    "x-society-id": user.societyId?.toString() || "",
    "x-member-id": user.memberId?.toString() || "",
    "x-user-id": user.id?.toString() || "",
    "x-user-name": user.fullName || user.email || "",
  });

  const fetchData = async () => {
    const headers = getAuthHeaders();
    const societiesRes = await fetch("/api/societies", { headers });
    const societiesData = await societiesRes.json();
    setSocieties(Array.isArray(societiesData) ? societiesData : []);

    const wingsRes = await fetch("/api/wings", { headers });
    const wingsData = await wingsRes.json();
    setWings(Array.isArray(wingsData) ? wingsData : []);
  };

  useEffect(() => {
    fetchData();
    if (!isSuperAdmin && user.societyId) {
      setFormData(prev => ({ ...prev, societyId: user.societyId.toString() }));
    }
    setGenFloors("");
    setGenFlatsPerFloor("");
    setGenSample("");
  }, [isDialogOpen]);

  const filteredWings = wings.filter((wing) => {
    const societyName = societies.find((s) => s.id === wing.societyId)?.name || "Unknown Society";
    const query = searchQuery.toLowerCase();

    const globalMatch =
      societyName.toLowerCase().includes(query) ||
      wing.wingName.toLowerCase().includes(query) ||
      wing.flats.toLowerCase().includes(query);

    return globalMatch;
  })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue: string = "";
      let bValue: string = "";

      if (sortConfig.key === "society") {
        aValue = (societies.find((s) => s.id === a.societyId)?.name || "Unknown Society").toLowerCase();
        bValue = (societies.find((s) => s.id === b.societyId)?.name || "Unknown Society").toLowerCase();
      } else if (sortConfig.key === "wing") {
        aValue = a.wingName.toLowerCase();
        bValue = b.wingName.toLowerCase();
      } else if (sortConfig.key === "flats") {
        // Sort by number of flats
        const aCount = a.flats.split(",").filter((f: string) => f.trim()).length;
        const bCount = b.flats.split(",").filter((f: string) => f.trim()).length;
        return sortConfig.direction === "asc" ? aCount - bCount : bCount - aCount;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  React.useEffect(() => {
    if (sessionStorage.getItem("tourFlow") !== "wings") return;

    // Debugging Tour Start
    console.log("Wings Tour: Starting...");
    const addWingBtn = document.querySelector("[data-tour='wing-add']");
    const menuMembers = document.querySelector("[data-tour-id='menu-members']");
    console.log("Wings Tour Elements:", {
      addWingBtn: !!addWingBtn,
      menuMembers: !!menuMembers,
      canEdit
    });

    // @ts-ignore
    const tour = introJs().setOptions({
      steps: [
        {
          element: "[data-tour='wing-add']",
          intro: "Click here to add a wing. Use the 'Flat Generator' to automatically create flat numbers (e.g., 101, 102)."
        },
        {
          element: "[data-tour-id='menu-members']",
          intro: "Step 3: After creating wings, go to the Members page to add residents.",
          disableInteraction: false
        },
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

    // Use event delegation for robust handling of sidebar clicks
    const handleMembersClick = (e: any) => {
      if (e.target.closest("[data-tour-id='menu-members']")) {
        console.log("Wings Tour: Menu Members Clicked -> Setting tourFlow='members'");
        sessionStorage.setItem("tourFlow", "members");
      }
    };
    document.addEventListener("click", handleMembersClick, true);

    const handleExit = () => {
      console.log("Wings Tour: Exiting...");
      // Delay check slightly to allow click event to process first if that was the trigger
      setTimeout(() => {
        if (sessionStorage.getItem("tourFlow") !== "members") {
          console.log("Wings Tour: Clearing tourFlow (not proceeding to members)");
          sessionStorage.removeItem("tourFlow");
        } else {
          console.log("Wings Tour: Proceeding to members...");
        }
      }, 100);
    };

    tour.onexit(handleExit);
    tour.oncomplete(() => {
      console.log("Wings Tour: Completed! Navigating to Members...");
      sessionStorage.setItem("tourFlow", "members");
      navigate("/members");
    });

    // Small delay to ensure Sidebar and DOM are fully ready
    setTimeout(() => {
      console.log("Wings Tour: calling start()");
      tour.start();
    }, 1000); // Increased to 1000ms to ensure DOM is ready

    return () => {
      document.removeEventListener("click", handleMembersClick, true);
      tour.exit(); // Force exit on unmount
    };
  }, []);

  const handleGenerateFlats = () => {
    const floors = parseInt(genFloors);
    const perFloor = parseInt(genFlatsPerFloor);
    if (isNaN(floors) || isNaN(perFloor)) {
      toastError("Please enter valid numbers for floors and flats per floor.");
      return;
    }

    // Parse Sample for Format
    // Default: 101 -> Prefix "", Pad 2
    let prefix = "";
    let padding = 2;

    if (genSample) {
      const match = genSample.match(/^(.*?)(\d+)$/);
      if (match) {
        prefix = match[1] ?? ""; // "A-" from "A-101"
        const numPart = match[2]; // "101"

        if (numPart && numPart.length > 1) {
          padding = numPart.length - 1;
        } else {
          padding = 1; // Fallback for single digit sample "1" -> Floor 1 + Unit 1 -> "11"
        }
      } else {
        // No digits found, treat whole sample as prefix
        prefix = genSample;
      }
    }

    const generated = [];
    for (let f = 1; f <= floors; f++) {
      for (let unit = 1; unit <= perFloor; unit++) {
        generated.push(`${prefix}${f}${unit.toString().padStart(padding, '0')}`);
      }
    }
    setFormData({ ...formData, flats: generated.join(", ") });
    success("Flat numbers generated!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate wing name in the same society
    const isDuplicate = wings.some(w =>
      w.societyId === Number(formData.societyId) &&
      w.wingName.toLowerCase().trim() === formData.wingName.toLowerCase().trim() &&
      (!editingWing || w.id !== editingWing.id)
    );

    if (isDuplicate) {
      toastError("A wing with this name already exists in this society.");
      return;
    }

    const method = editingWing ? "PUT" : "POST";
    const url = editingWing ? `/api/wings/${editingWing.id}` : "/api/wings";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          societyId: Number(formData.societyId)
        }),
      });

      if (res.ok) {
        success(editingWing ? "Wing updated successfully" : "Wing added successfully");
        fetchData();
        setIsDialogOpen(false);
        setEditingWing(null);
        setFormData({ societyId: isSuperAdmin ? "" : user.societyId.toString(), wingName: "", flats: "" });
      } else {
        toastError("Failed to save wing");
      }
    } catch (err) {
      console.error(err);
      toastError("An error occurred during save.");
    }
  };

  const handleEdit = (wing: any) => {
    setEditingWing(wing);
    setFormData({
      societyId: wing.societyId.toString(),
      wingName: wing.wingName,
      flats: wing.flats
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!wingToDelete) return;
    try {
      const res = await fetch(`/api/wings/${wingToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        success("Wing deleted successfully");
        fetchData();
      } else {
        toastError("Failed to delete wing");
      }
    } catch (err) {
      console.error(err);
      toastError("An error occurred during deletion.");
    }
    setWingToDelete(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <Layout>
      <div className="bg-background min-h-full">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Wing Management</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Wing Master</CardTitle>
                <CardDescription className="text-muted-foreground">Configure wings and flat numbers</CardDescription>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search wings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 bg-card border-border"
                  />
                </div>
                {canEdit && (
                  <Button
                    data-tour="wing-add"
                    size="sm"
                    onClick={() => {
                      setEditingWing(null);
                      setFormData({ societyId: isSuperAdmin ? "" : user.societyId.toString(), wingName: "", flats: "" });
                      setGenFloors("");
                      setGenFlatsPerFloor("");
                      setGenSample("");
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Wing
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWings.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">No wings found matching your filters</p>
                  </div>
                ) : (
                  Object.entries(
                    filteredWings.reduce((acc, wing) => {
                      const societyName = societies.find(s => s.id === wing.societyId)?.name || "Unknown Society";
                      if (!acc[societyName]) acc[societyName] = [];
                      acc[societyName].push(wing);
                      return acc;
                    }, {} as Record<string, typeof wings>)
                  ).sort((a, b) => a[0].localeCompare(b[0])).map(([societyName, societyWings]) => (
                    <div key={societyName} className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">{societyName}</h3>
                        <div className="flex-1 h-px bg-border ml-2" />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {Array.isArray(societyWings) && societyWings.map((wing: any) => (
                          <div key={wing.id} className="p-4 bg-card border border-border rounded-lg shadow-sm hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-foreground">{wing.wingName}</h4>
                                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold">
                                  {wing.flats.split(',').length} Flats
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => handleEdit(wing)}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => { setWingToDelete(wing); setIsDeleteModalOpen(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2" title={wing.flats}>
                              {wing.flats}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wing</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete <span className="font-bold text-foreground">{wingToDelete?.wingName}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isDialogOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-card rounded-lg shadow-xl border border-border max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-bold mb-4 text-foreground">{editingWing ? "Edit Wing" : "Add Wing"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSuperAdmin && (
                  <div>
                    <Label>Society</Label>
                    <select
                      className="w-full h-10 border rounded px-3 mt-1"
                      value={formData.societyId}
                      onChange={e => setFormData({ ...formData, societyId: e.target.value })}
                      required
                    >
                      <option value="">Select Society</option>
                      {societies.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label>Wing Name</Label>
                  <Input
                    value={formData.wingName}
                    onChange={e => setFormData({ ...formData, wingName: e.target.value })}
                    placeholder="e.g. Wing A"
                    required
                  />
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Flat Generator</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-[10px]">Total Floors</Label>
                      <Input
                        type="number"
                        value={genFloors}
                        onChange={e => setGenFloors(e.target.value)}
                        placeholder="e.g. 10"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Flats / Floor</Label>
                      <Input
                        type="number"
                        value={genFlatsPerFloor}
                        onChange={e => setGenFlatsPerFloor(e.target.value)}
                        placeholder="e.g. 4"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">Sample Flat No.</Label>
                      <Input
                        value={genSample}
                        onChange={e => setGenSample(e.target.value)}
                        placeholder="e.g. 101 or A-101"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2 h-8 text-xs"
                    onClick={handleGenerateFlats}
                  >
                    Generate Flat List
                  </Button>
                </div>

                <div>
                  <Label>Flats (comma separated)</Label>
                  <Input
                    value={formData.flats}
                    onChange={e => setFormData({ ...formData, flats: e.target.value })}
                    placeholder="101, 102, 103..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Example: 101, 102, 103</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">{editingWing ? "Update" : "Add"} Wing</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wings;