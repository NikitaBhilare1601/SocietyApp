import React, { useEffect, useState } from "react";
import { Building2, Users, FileText, Settings, LogOut, Home, User, Bell, Layers, Upload, ScrollText, X, Compass, CircleHelp, ChevronUp } from "lucide-react";
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

const Sidebar = ({ 
  className, 
  onClose, 
  onStartTour,
  isCollapsed,
  onToggleCollapse
}: { 
  className?: string, 
  onClose?: () => void, 
  onStartTour?: () => void,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void
}) => {
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
    const handleStorageChange = () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(storedUser);
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for custom events if the same window is updated
    window.addEventListener("userProfileUpdate", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userProfileUpdate", handleStorageChange);
    };
  }, []);

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

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen) {
        const target = event.target as HTMLElement;
        const isTrigger = target.closest('[data-tour-id="user-profile"]');
        const isDropdown = target.closest('[data-tour-id="profile-dropdown"]');
        
        if (!isTrigger && !isDropdown) {
          setIsProfileOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-sidebar flex flex-col h-screen border-r border-sidebar-border transition-all duration-300 ease-in-out ${className || ''}`} data-tour="sidebar">
      {/* Logo Section */}
      <div className={`h-16 flex items-center border-b border-border ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
        <div 
          className="flex items-center gap-2 cursor-pointer transition-all duration-300" 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src={logoUrl || logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-foreground truncate animate-in fade-in duration-500">
              Society Manager
            </span>
          )}
        </div>
        {!isCollapsed && onClose && (
          <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2 overflow-y-auto no-scrollbar`} data-tour-id="sidebar-nav">
        {menuItems.map((item) => {
          return (
            hasPermission(item.permission) && (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-tour-id={`menu-${item.label.toLowerCase().replace(" ", "-")}`}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center gap-3 rounded-md transition-all duration-200 ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2'} ${isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
              >
                <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} transition-all`} />
                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap overflow-hidden animate-in slide-in-from-left-2 duration-300">{item.label}</span>}
              </Link>
            )
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="relative">
          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div 
              data-tour-id="profile-dropdown"
              style={!isCollapsed ? { bottom: 'calc(100% + 12px)', left: 0, right: 0 } : { left: 'calc(100% + 16px)', bottom: 0 }}
              className={`absolute z-[100] bg-card border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-2 duration-200 overflow-visible rounded-2xl min-w-[240px]`}
            >
              {/* Dropdown Menu Items */}
              <div className="p-2 space-y-1">
                <Link 
                  to="/profile" 
                  onClick={() => setIsProfileOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-bold">My Profile</span>
                </Link>
                <div className="h-px bg-border/50 my-2 mx-1.5" />
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Section Trigger */}
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 p-2 w-full rounded-2xl cursor-pointer hover:bg-accent transition-all duration-300 group border border-transparent hover:border-border/50 ${isCollapsed ? 'justify-center' : ''}`} 
            data-tour-id="user-profile"
            title={isCollapsed ? (user.fullName || user.name || 'User') : ""}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-base border border-primary/20 flex-shrink-0 shadow-sm group-hover:scale-105 transition-all duration-500">
                {(user.fullName || user.name || 'U').charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-sidebar rounded-full shadow-md" />
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                    {user.fullName || user.name || 'User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-[0.15em] font-black mt-0.5 opacity-40 group-hover:opacity-80 transition-all duration-300">
                    {user.roleName || 'Role'}
                  </p>
                </div>
                <ChevronUp className={`w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all duration-500 ${isProfileOpen ? 'rotate-180 opacity-100' : 'opacity-40'}`} />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
