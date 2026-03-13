import React, { useState } from "react";
import { Settings as SettingsIcon, Home, Shield, Menu as MenuIcon, Users as UsersIcon, Layers, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
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

const Settings = () => {
  const { success, error: toastError } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = currentUser.roleName === "Super Admin";
  const isSocietyAdmin = currentUser.roleName === "Society Admin" || currentUser.roleName === "Society Secretary";

  const showPermissionMatrix = isSuperAdmin || isSocietyAdmin;

  const perms = (currentUser.permissions || "").split(",");
  const canEditSettings = perms.includes("all") || perms.includes("settings:edit") || perms.includes("settings");

  // Determine default tab
  const getDefaultTab = () => {
    if (showPermissionMatrix) return "menus";
    return "profile";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  return (
    <Layout>
      <div className="bg-background min-h-full">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-foreground">Settings & Masters</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              <span>/</span>
              <span>Settings</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 space-y-6">
          {/* Horizontal Tabs */}
          <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
            >
              <User className="w-4 h-4" />
              My Profile
            </button>

            {showPermissionMatrix && (
              <button
                onClick={() => setActiveTab("menus")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "menus"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
              >
                <MenuIcon className="w-4 h-4" />
                Permission Matrix
              </button>
            )}
            {(isSuperAdmin || isSocietyAdmin) && (
              <button
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "roles"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
              >
                <Shield className="w-4 h-4" />
                Role Master
              </button>
            )}
            {(isSuperAdmin || isSocietyAdmin) && (
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
              >
                <UsersIcon className="w-4 h-4" />
                User Management
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="w-full">
            {activeTab === "profile" && <UserProfile currentUser={currentUser} />}
            {activeTab === "roles" && (isSuperAdmin || isSocietyAdmin) && <RoleMaster success={success} toastError={toastError} />}
            {activeTab === "menus" && showPermissionMatrix && <MenuMaster success={success} toastError={toastError} />}
            {activeTab === "users" && <UserManagement success={success} toastError={toastError} />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const UserProfile = ({ currentUser }: { currentUser: any }) => {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">My Profile</CardTitle>
        <CardDescription className="text-muted-foreground">View your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-foreground">Full Name</Label>
            <div className="p-3 bg-muted/30 rounded border border-border text-foreground">
              {currentUser.fullName || "N/A"}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Email Address</Label>
            <div className="p-3 bg-muted/30 rounded border border-border text-foreground">
              {currentUser.email || "N/A"}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Role</Label>
            <div className="p-3 bg-muted/30 rounded border border-border text-foreground">
              {currentUser.roleName || "N/A"}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Society ID</Label>
            <div className="p-3 bg-muted/30 rounded border border-border text-foreground">
              {currentUser.societyId || "N/A"}
            </div>
          </div>
          {currentUser.memberId && (
            <div className="space-y-2">
              <Label className="text-foreground">Member ID</Label>
              <div className="p-3 bg-muted/30 rounded border border-border text-foreground">
                {currentUser.memberId}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RoleMaster = ({ success, toastError }: { success: any, toastError: any }) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const perms = (currentUser.permissions || "").split(",");
  const canManageRoles = perms.includes("all") || perms.includes("settings:edit") || perms.includes("settings");

  const [roles, setRoles] = useState<any[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleFormData, setRoleFormData] = useState({ name: "", description: "", permissions: "", whatsappNumber: "", isWhatsApp: false });
  const [isRoleDeleteModalOpen, setIsRoleDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  const getRoleAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "Content-Type": "application/json",
      "x-user-role": user.roleName || "",
      "x-society-id": user.societyId?.toString() || "",
      "x-member-id": user.memberId?.toString() || "",
      "x-user-id": user.id?.toString() || "",
      "x-user-name": user.fullName || user.email || "",
    };
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles", { headers: getRoleAuthHeaders() });
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Fetch roles error:", err);
    }
  };

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingRole ? "PUT" : "POST";
    const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";

    try {
      const res = await fetch(url, {
        method,
        headers: getRoleAuthHeaders(),
        body: JSON.stringify(roleFormData),
      });

      if (res.ok) {
        success(editingRole ? "Role updated successfully" : "Role added successfully");
        fetchRoles();
        setIsRoleDialogOpen(false);
        setEditingRole(null);
        setRoleFormData({ name: "", description: "", permissions: "", whatsappNumber: "", isWhatsApp: false });
      } else {
        toastError("Failed to save role");
      }
    } catch (err) {
      console.error("Save role error:", err);
      toastError("An error occurred while saving.");
    }
  };

  const handleRoleEdit = (role: any) => {
    console.log("Editing role:", role);
    setEditingRole(role);
    setRoleFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: role.permissions || "",
      whatsappNumber: role.whatsappNumber || "",
      isWhatsApp: !!role.isWhatsApp
    });
    setIsRoleDialogOpen(true);
  };

  const confirmRoleDelete = async () => {
    if (roleToDelete !== null) {
      try {
        const res = await fetch(`/api/roles/${roleToDelete.id}`, {
          method: "DELETE",
          headers: getRoleAuthHeaders()
        });
        if (res.ok) {
          success("Role deleted successfully");
          fetchRoles();
        } else {
          toastError("Failed to delete role");
        }
      } catch (err) {
        console.error("Delete role error:", err);
        toastError("An error occurred during deletion.");
      }
      setRoleToDelete(null);
      setIsRoleDeleteModalOpen(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Role Master</CardTitle>
          <CardDescription className="text-muted-foreground">Manage user roles and permissions</CardDescription>
        </div>
        {canManageRoles && (
          <Button
            className="shadow-lg shadow-primary/20"
            onClick={() => {
              setEditingRole(null);
              setRoleFormData({ name: "", description: "", permissions: "", whatsappNumber: "", isWhatsApp: false });
              setIsRoleDialogOpen(true);
            }}
          >
            Add Role
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold text-foreground">{role.name}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-muted-foreground/60">Perms: {role.permissions}</p>
                  {role.whatsappNumber && (
                    <p className="text-xs text-primary font-medium">
                      Mobile: {role.whatsappNumber} {role.isWhatsApp === 1 && "(WhatsApp)"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canManageRoles && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleRoleEdit(role)} className="border-border">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-border hover:bg-destructive/10" onClick={() => {
                      setRoleToDelete(role);
                      setIsRoleDeleteModalOpen(true);
                    }}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <AlertDialog open={isRoleDeleteModalOpen} onOpenChange={setIsRoleDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the role <span className="font-bold text-foreground">{roleToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Dialog */}
      {isRoleDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">{editingRole ? "Edit Role" : "Add Role"}</h2>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <Label className="text-foreground">Role Name</Label>
                <Input
                  className="bg-card border-border text-foreground"
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Description</Label>
                <Input
                  className="bg-card border-border text-foreground"
                  value={roleFormData.description}
                  onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-foreground">Permissions (comma separated)</Label>
                <Input
                  className="bg-card border-border text-foreground"
                  value={roleFormData.permissions}
                  onChange={e => setRoleFormData({ ...roleFormData, permissions: e.target.value })}
                  placeholder="e.g. societies,members,reports"
                />
              </div>
              <div>
                <Label className="text-foreground">Mobile Number</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Input
                    className="flex-1 bg-card border-border text-foreground"
                    value={roleFormData.whatsappNumber}
                    onChange={e => setRoleFormData({ ...roleFormData, whatsappNumber: e.target.value })}
                    placeholder="e.g. 919876543210"
                  />
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      id="isWhatsApp"
                      checked={roleFormData.isWhatsApp}
                      onChange={e => setRoleFormData({ ...roleFormData, isWhatsApp: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label htmlFor="isWhatsApp" className="cursor-pointer text-xs text-foreground">WhatsApp</Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 shadow-lg shadow-primary/20">
                  {editingRole ? "Update" : "Add"} Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

const MenuMaster = ({ success, toastError }: { success: any, toastError: any }) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const menus = ["dashboard", "societies", "wings", "members", "logs", "reports", "settings", "import"];

  // Parse user once at component level
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return {};
    }
  }, []);

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      "x-user-role": currentUser.roleName || "",
      "x-society-id": currentUser.societyId?.toString() || "",
      "x-member-id": currentUser.memberId?.toString() || "",
      "x-user-id": currentUser.id?.toString() || "",
      "x-user-name": currentUser.fullName || currentUser.email || "",
    };
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles", { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        console.error("API returned non-array roles:", data);
        toastError("Failed to load roles: Invalid data format");
        setRoles([]);
      }
      setHasChanges(false);
    } catch (e) {
      console.error("Error fetching roles:", e);
      toastError("Failed to load roles");
    }
  };

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (roleId: number, menu: string, type: 'view' | 'edit') => {
    try {
      console.log(`Toggling permission: roleId=${roleId}, menu=${menu}, type=${type}`);

      const perms = (currentUser.permissions || "").split(",");
      const isSuperAdmin = currentUser.roleName === "Super Admin";
      const isSocietyAdmin = currentUser.roleName === "Society Admin";

      const hasEditPermission = currentUser.permissions === "all" ||
        perms.includes("settings:edit") ||
        perms.includes("settings") ||
        isSuperAdmin ||
        isSocietyAdmin;

      if (!hasEditPermission) {
        toastError("Permission denied: You do not have permission to edit settings.");
        return;
      }

      // Check if trying to edit Super Admin role without being Super Admin
      const targetRole = roles.find(r => String(r.id) === String(roleId));
      if (targetRole?.name === "Super Admin" && !isSuperAdmin) {
        toastError("Permission denied: Only Super Admin can modify Super Admin permissions.");
        return;
      }

      // Calculate new roles state safely outside setRoles to catch errors
      const newRoles = roles.map(role => {
        if (!role) return role;
        // Ensure ID comparison is robust (handle string/number mismatch)
        if (String(role.id) !== String(roleId)) return role;

        let currentPermsString = (typeof role.permissions === 'string' ? role.permissions : "");

        // Handle 'all' permissions: expand to explicit list of all menus
        if (currentPermsString === 'all') {
          const expanded: string[] = [];
          menus.forEach(m => {
            expanded.push(`${m}:view`);
            expanded.push(`${m}:edit`);
          });
          currentPermsString = expanded.join(",");
        }

        const currentPerms = currentPermsString
          .split(",")
          .map((p: string) => p.trim())
          .filter((p: string) => p && p.length > 0);

        // Remove all existing permissions for this specific menu to start clean
        const otherPerms = currentPerms.filter((p: string) => !p.startsWith(`${menu}:`) && p !== menu);

        // Check what permission currently exists for this menu
        const existingPerm = currentPerms.find((p: string) => p.startsWith(`${menu}:`) || p === menu);
        let existingType = null;
        if (existingPerm) {
          if (existingPerm === menu) existingType = 'view'; // legacy support
          else existingType = existingPerm.split(":")[1];
        }

        let newPermToAdd = null;

        if (type === 'view') {
          // Clicked View Checkbox
          if (existingType === 'view' || existingType === 'edit') {
            // If any permission exists, View is effectively "checked".
            // Clicking it implies "Uncheck", so remove all access.
            newPermToAdd = null;
          } else {
            // No access, enable View
            newPermToAdd = `${menu}:view`;
          }
        } else if (type === 'edit') {
          // Clicked Edit Checkbox
          if (existingType === 'edit') {
            // Was Edit, toggle OFF (downgrade to View)
            newPermToAdd = `${menu}:view`;
          } else {
            // Was View or None, upgrade to Edit
            newPermToAdd = `${menu}:edit`;
          }
        }

        const newPerms = [...otherPerms];
        if (newPermToAdd) {
          newPerms.push(newPermToAdd);
        }

        console.log(`Role ${role.name} updated. New perms: ${newPerms.join(",")}`);
        return { ...role, permissions: newPerms.join(",") };
      });

      setRoles(newRoles);
      setHasChanges(true);
    } catch (error) {
      console.error("Error in togglePermission:", error);
      toastError("An error occurred while updating permissions.");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await Promise.all(roles.map(role =>
        fetch(`/api/roles/${role.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(role),
        })
      ));
      setHasChanges(false);
      success("Permissions updated successfully!");
    } catch (error) {
      console.error(error);
      toastError("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if current user can edit matrix
  const userPerms = (currentUser.permissions || "").split(",");
  const isSuperAdmin = currentUser.roleName === "Super Admin";
  const isSocietyAdmin = currentUser.roleName === "Society Admin";
  const canEditMatrix = userPerms.includes("all") ||
    userPerms.includes("settings:edit") ||
    userPerms.includes("settings") ||
    isSuperAdmin ||
    isSocietyAdmin;

  console.log("MenuMaster rendering. canEditMatrix:", canEditMatrix);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Permission Matrix</CardTitle>
          <CardDescription className="text-muted-foreground">Configure View and Edit access for roles</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-500 font-medium font-serif italic">Unsaved changes</span>
          )}
          {hasChanges && canEditMatrix && (
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="shadow-lg shadow-primary/20"
            >
              {isSaving ? "Saving..." : "Save Matrix"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 transition-colors">
                <th className="text-left p-4 font-semibold text-foreground sticky left-0 bg-muted/80 backdrop-blur z-10 border-r border-border transition-colors">Role</th>
                {menus.map(m => (
                  <th key={m} className="text-center p-4 font-semibold text-foreground border-l border-border" colSpan={2}>
                    <div className="capitalize mb-2">{m}</div>
                    <div className="flex justify-center gap-8 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>View</span>
                      <span>Edit</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(roles) && roles.map(role => {
                if (!role) return null;
                return (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                    <td className="p-4 font-medium text-foreground sticky left-0 bg-card group-hover:bg-muted/50 z-10 border-r border-border transition-colors">
                      {role.name}
                    </td>
                    {menus.map(menu => {
                      const rawPerms = role.permissions;
                      const perms = rawPerms === 'all' ? [] : (typeof rawPerms === 'string' ? rawPerms : "").split(",").map((p: string) => p.trim());

                      const viewChecked = rawPerms === 'all' || perms.includes(`${menu}:view`) || perms.includes(`${menu}:edit`) || perms.includes(menu);
                      const editChecked = rawPerms === 'all' || perms.includes(`${menu}:edit`) || (perms.includes(menu) && menu !== 'logs' && menu !== 'reports');

                      const isSuperAdminRole = role.name === "Super Admin";
                      const isAllowedToEdit = canEditMatrix && (!isSuperAdminRole || isSuperAdmin);

                      return (
                        <td key={menu} className="text-center p-4 border-l border-border" colSpan={2}>
                          <div className="flex justify-center gap-10">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              checked={viewChecked}
                              disabled={isSaving || !isAllowedToEdit}
                              onChange={() => togglePermission(role.id, menu, 'view')}
                            />
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              checked={editChecked}
                              disabled={isSaving || !isAllowedToEdit}
                              onChange={() => togglePermission(role.id, menu, 'edit')}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const UserManagement = ({ success, toastError }: { success: any, toastError: any }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", roleId: "", status: "Active",
    societyId: "", memberId: "", mobileNumber: ""
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "Content-Type": "application/json",
      "x-user-role": user.roleName || "",
      "x-society-id": user.societyId?.toString() || "",
      "x-member-id": user.memberId?.toString() || "",
      "x-user-id": user.id?.toString() || "",
      "x-user-name": user.fullName || user.email || "",
    };
  };

  const fetchData = async () => {
    const headers = getAuthHeaders();
    const [uRes, rRes, sRes, mRes] = await Promise.all([
      fetch("/api/users", { headers }),
      fetch("/api/roles", { headers }),
      fetch("/api/societies", { headers }),
      fetch("/api/members", { headers })
    ]);
    setUsers(await uRes.json());
    setRoles(await rRes.json());
    setSocieties(await sRes.json());
    setMembers(await mRes.json());
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? "PUT" : "POST";
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          roleId: Number(formData.roleId),
          societyId: formData.societyId ? Number(formData.societyId) : null,
          memberId: formData.memberId ? Number(formData.memberId) : null,
          mobileNumber: formData.mobileNumber || null
        }),
      });

      if (res.ok) {
        success(editingUser ? "User updated successfully" : "User added successfully");
        fetchData();
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData({ fullName: "", email: "", password: "", roleId: "", status: "Active", societyId: "", memberId: "", mobileNumber: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        toastError(data.message || "Failed to save user");
      }
    } catch (err) {
      console.error(err);
      toastError("An error occurred during save.");
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      roleId: user.roleId.toString(),
      status: user.status,
      societyId: user.societyId?.toString() || "",
      memberId: user.memberId?.toString() || "",
      mobileNumber: user.mobileNumber || ""
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete !== null) {
      try {
        const res = await fetch(`/api/users/${userToDelete.id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.ok) {
          success("User deleted successfully");
          fetchData();
        } else {
          toastError("Failed to delete user");
        }
      } catch (err) {
        console.error(err);
        toastError("An error occurred during deletion.");
      }
      setUserToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const selectedRole = roles.find(r => r.id.toString() === formData.roleId);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">User Management</CardTitle>
          <CardDescription className="text-muted-foreground">Manage system users and their access</CardDescription>
        </div>
        <Button
          className="shadow-lg shadow-primary/20"
          onClick={() => {
            setEditingUser(null);
            setFormData({ fullName: "", email: "", password: "", roleId: "", status: "Active", societyId: "", memberId: "", mobileNumber: "" });
            setIsDialogOpen(true);
          }}
        >
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border border-border rounded-lg gap-4">
              <div>
                <h3 className="font-semibold text-foreground">{user.fullName || user.email}</h3>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 mt-1">
                  <span className="text-muted-foreground/70">{user.email}</span>
                  <span>•</span>
                  <span className="font-medium text-foreground/80">{user.roleName}</span>
                  <span>•</span>
                  <span className={user.status === 'Active' ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>{user.status}</span>
                  {user.societyName && (
                    <>
                      <span>•</span>
                      <span className="text-primary">Society: {user.societyName}</span>
                    </>
                  )}
                  {user.memberName && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400">Member: {user.memberName}</span>
                    </>
                  )}
                  {user.mobileNumber && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-medium">Mobile: {user.mobileNumber}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => handleEdit(user)} className="flex-1 sm:flex-none border-border">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-border flex-1 sm:flex-none hover:bg-destructive/10" onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete user <span className="font-bold text-foreground">{userToDelete?.fullName || userToDelete?.email}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6 dialog-content overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4 text-foreground">{editingUser ? "Edit User" : "Add User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-foreground">Full Name</Label>
                <Input className="bg-card border-border text-foreground" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required placeholder="e.g. John Doe" />
              </div>

              <div>
                <Label className="text-foreground">Email</Label>
                <Input className="bg-card border-border text-foreground" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="e.g. john@example.com" />
              </div>

              <div>
                <Label className="text-foreground">{editingUser ? "New Password (optional)" : "Password"}</Label>
                <Input className="bg-card border-border text-foreground" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
              </div>

              <div>
                <Label className="text-foreground">Mobile Number (for WhatsApp)</Label>
                <Input className="bg-card border-border text-foreground" value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} placeholder="e.g. +919876543210" />
              </div>

              <div>
                <Label className="text-foreground">Role</Label>
                <select
                  className="w-full h-10 bg-card border border-border rounded px-3 mt-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.roleId}
                  onChange={e => setFormData({ ...formData, roleId: e.target.value, societyId: "", memberId: "" })}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {selectedRole?.name === "Society Admin" && (
                <div>
                  <Label className="text-foreground">Assign to Society</Label>
                  <select
                    className="w-full h-10 bg-card border border-border rounded px-3 mt-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.societyId}
                    onChange={e => setFormData({ ...formData, societyId: e.target.value })}
                    required
                  >
                    <option value="">Select Society</option>
                    {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {selectedRole?.name === "Member" && (
                <div>
                  <Label className="text-foreground">Link to Member</Label>
                  <select
                    className="w-full h-10 bg-card border border-border rounded px-3 mt-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.memberId}
                    onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.flatNumber} - {m.societyName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label className="text-foreground">Status</Label>
                <select
                  className="w-full h-10 bg-card border border-border rounded px-3 mt-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 shadow-lg shadow-primary/20">{editingUser ? "Update" : "Add"} User</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Settings;
