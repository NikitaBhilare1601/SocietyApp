import React, { useEffect, useState } from "react";
import { Building2, Users, FileText, Settings, LogOut, Home, User, Bell, Layers, Upload, ScrollText, X, Compass, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const removeWhiteBackground = (src: string, threshold = 245): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r !== undefined && g !== undefined && b !== undefined && r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

const Sidebar = ({ className, onClose, onStartTour }: { className?: string, onClose?: () => void, onStartTour?: () => void }) => {
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("Sidebar: Initial user from localStorage:", storedUser);
    return storedUser;
  });
  const logoSrc = "/logo-final.png";
  const [logoUrl, setLogoUrl] = useState<string>(logoSrc);

  useEffect(() => {
    let active = true;
    removeWhiteBackground(logoSrc).then((url) => {
      if (active) setLogoUrl(url);
    });
    return () => {
      active = false;
    };
  }, [logoSrc]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    fetch("/api/roles")
      .then((res) => res.json())
      .then((roles) => {
        if (!Array.isArray(roles)) return;
        const roleMatch =
          roles.find((r: any) => String(r.id) === String(storedUser.roleId)) ||
          roles.find((r: any) => String(r.name).toLowerCase() === String(storedUser.roleName || "").toLowerCase());
        
        if (!roleMatch) {
          localStorage.removeItem("user");
          window.location.href = "/";
          return;
        }
        const roleNameLower = String(roleMatch.name || "").toLowerCase();
        const fallbackPermissions =
          roleNameLower === "super admin"
            ? "all"
            : roleNameLower === "society admin"
              ? "dashboard:view,societies:edit,wings:edit,members:edit,logs:view,reports:view,settings:edit,import"
              : roleNameLower === "member"
                ? "dashboard:view,settings:view"
                : "";
        let finalPermissions = roleMatch.permissions || fallbackPermissions;

        // Ensure Society Admin has import permission
        if (roleNameLower === "society admin" && !finalPermissions.includes("import") && !finalPermissions.includes("all")) {
          finalPermissions = finalPermissions ? `${finalPermissions},import` : "import";
        }

        // Ensure Member has settings:view permission
        if (roleNameLower === "member" && !finalPermissions.includes("settings:view") && !finalPermissions.includes("all")) {
          finalPermissions = finalPermissions ? `${finalPermissions},settings:view` : "settings:view";
        }

        const nextUser = {
          ...storedUser,
          roleName: roleMatch.name,
          permissions: finalPermissions,
          roleId: roleMatch.id,
        };
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
        console.log("Sidebar: User after API update:", nextUser);
      })
      .catch(() => null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;

  // Helper to check permissions
  const hasPermission = (menu: string) => {
    // Force enable Import for Society Admin (case insensitive)
    if (menu === "import") {
      const role = (user.roleName || "").toLowerCase();
      // Relaxed check: allow if role contains "admin" (e.g. "Society Admin", "Super Admin")
      if (role.includes("admin")) {
        console.log(`[DEBUG] Allow import for admin role: ${role}`);
        return true;
      }
    }

    if (!user.permissions) {
      console.log(`Sidebar: No permissions found for user. Menu: ${menu}`);
      return false;
    }
    const perms = user.permissions.split(",");
    console.log(`Sidebar: Checking permission for menu '${menu}'. User permissions: '${user.permissions}'. Parsed perms:`, perms);
    if (perms.includes("all")) {
      console.log(`Sidebar: Permission granted for '${menu}' because 'all' is present.`);
      return true;
    }
    // Check for new format "menu:view" or "menu:edit" OR old format "menu"
    const result = perms.some((p: string) => p.startsWith(`${menu}:`) || p === menu || p === menu.toLowerCase());
    console.log(`Sidebar: Permission check for '${menu}' result: ${result}`);
    return result;
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, permission: "dashboard" },
    { path: "/societies", label: "Societies", icon: Building2, permission: "societies" },
    { path: "/wings", label: "Wings", icon: Layers, permission: "wings" },
    { path: "/members", label: "Members", icon: Users, permission: "members" },
    { path: "/import", label: "Import", icon: Upload, permission: "import" },
    { path: "/logs", label: "Audit Logs", icon: ScrollText, permission: "logs" },

    { path: "/settings", label: "Settings", icon: Settings, permission: "settings" },
  ];

  return (
    <aside className={`w-64 bg-sidebar flex flex-col h-screen border-r border-sidebar-border transition-colors ${className || ''}`} data-tour="sidebar">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logoUrl || logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Society Manager
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" data-tour-id="sidebar-nav">
        {menuItems.map((item) => {
          return (
            hasPermission(item.permission) && (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-tour-id={`menu-${item.label.toLowerCase().replace(" ", "-")}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-end px-2">
        </div>

        <div className="flex items-center gap-3 px-2 py-2" data-tour-id="user-profile">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
            {(user.fullName || user.name || 'U').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.fullName || user.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.roleName || 'Role'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
