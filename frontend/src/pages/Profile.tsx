import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { User, Mail, Shield, Calendar, MapPin, Phone, Edit2, Camera, X, Check, Bell, Lock, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "../components/ui/Toast";

const DetailItem = ({ 
  icon: Icon, 
  label, 
  value, 
  field, 
  isEditing, 
  editValue, 
  onChange,
  error,
  maxLength
}: { 
  icon: any, 
  label: string, 
  value: string, 
  field?: string,
  isEditing: boolean,
  editValue?: string,
  onChange?: (val: string) => void,
  error?: string,
  maxLength?: number
}) => {



  const isEditable = isEditing && field && field !== 'roleName' && field !== 'createdAt';
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 group ${
      isEditable
        ? error 
          ? "bg-destructive/5 border-destructive/50 shadow-[0_0_10px_rgba(var(--destructive),0.1)]"
          : "bg-primary/5 border-primary/30 shadow-sm"
        : "bg-muted/30 border-border/50 hover:border-primary/20"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
        isEditable
          ? error ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold leading-none">{label}</p>
          {error && <span className="text-[8px] text-destructive font-bold uppercase animate-pulse">{error}</span>}
        </div>
        {isEditable ? (
          <input
            id={`input-${field}`}
            name={field}
            className={`w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 placeholder:text-muted-foreground/30 transition-colors ${
              error ? "text-destructive" : "text-foreground focus:text-primary"
            }`}
            value={editValue ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Enter ${label}`}
            maxLength={maxLength}
          />

        ) : (
          <p className="text-xs font-bold text-foreground truncate">{value || "Not Set"}</p>
        )}
      </div>
    </div>
  );
};


const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (e) {
        console.error("Profile: Failed to parse user data", e);
      }
    }
  }, []);

  // Fallback user if not found
  const displayUser = user || {
    fullName: "Guest User",
    name: "Guest",
    email: "guest@example.com",
    roleName: "Guest",
    mobileNumber: "Not Set",
    address: "Pune, India",
    createdAt: new Date().toISOString()
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Pre-filter mobile number to ensure it only has digits and max 10 chars
      const initialMobile = (displayUser.mobileNumber || "").replace(/\D/g, '').slice(0, 10);
      setEditData({ ...displayUser, mobileNumber: initialMobile });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };


  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editData.fullName || editData.fullName.trim().length < 3) {
      newErrors.fullName = "Min 3 characters";
    }

    // Robust email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!editData.email || !emailRegex.test(editData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Strict 10 digits for mobile
    if (!editData.mobileNumber || !/^\d{10}$/.test(editData.mobileNumber)) {
      newErrors.mobileNumber = "Exactly 10 digits required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMobileChange = (val: string) => {
    // Only allow digits and max length 10
    const filtered = val.replace(/\D/g, '').slice(0, 10);
    setEditData({ ...editData, mobileNumber: filtered });
  };


  const handleEmailChange = (val: string) => {
    setEditData({ ...editData, email: val });
    // Live validation for email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (val && !emailRegex.test(val)) {
      setErrors(prev => ({ ...prev, email: "Invalid email format" }));
    } else {
      setErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0] || "Please check your inputs";
      toastError(firstError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${displayUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": displayUser.roleName || "",
          "x-society-id": displayUser.societyId?.toString() || "",
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const updatedUser = { ...displayUser, ...editData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("userProfileUpdate"));
        setIsEditing(false);
        setErrors({});
        toastSuccess("Profile updated successfully");
      } else {
        const data = await res.json();
        toastError(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      toastError("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...displayUser, profilePicture: data.url };
        
        const saveRes = await fetch(`/api/users/${displayUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": displayUser.roleName || "",
            "x-society-id": displayUser.societyId?.toString() || "",
          },
          body: JSON.stringify(updatedUser),
        });

        if (saveRes.ok) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          toastSuccess("Profile picture updated");
        } else {
          toastError("Failed to save profile picture link");
        }
      } else {
        toastError("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toastError("An error occurred during upload");
    }
  };

  return (
    <Layout>
      <div className="min-h-full bg-background relative selection:bg-primary/30 flex flex-col items-center justify-start pt-8 pb-12 px-4 shadow-inner">
        {/* 1. Dynamic Mesh Background Layer - Subtler for Compact View */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="absolute top-[-10%] left-[-10%] w-1/3 h-1/3 bg-blue-600/5 blur-[80px] rounded-full animate-pulse" />
          <div className="absolute bottom-[20%] right-[-5%] w-1/4 h-1/4 bg-purple-600/5 blur-[60px] rounded-full animate-pulse delay-700" />
        </div>

        {/* 2. Main Content Wrapper - Tight vertical flow */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center space-y-4 md:space-y-6">
          {/* Identity Section - Significantly Shrunken */}
          <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
            {/* Shrunken Avatar Sphere */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border-[6px] border-background shadow-xl flex items-center justify-center overflow-hidden transition-all duration-500">
                {displayUser.profilePicture ? (
                  <img src={displayUser.profilePicture} alt={displayUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-3xl md:text-5xl font-black text-white tracking-tighter">
                    {(isEditing ? editData.fullName || editData.name || 'G' : displayUser.fullName || displayUser.name || 'G').charAt(0)}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="profile-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <button 
                onClick={() => document.getElementById('profile-upload')?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white border-4 border-background shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all z-20"
              >
                <Camera className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
              </button>
            </div>

            {/* User Metadata - High contrast, small footprint */}
            <div className="space-y-1">
              {isEditing ? (
                <input
                  className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none bg-transparent border-none text-center focus:ring-0 p-0"
                  value={editData.fullName || ""}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  placeholder="Full Name"
                />
              ) : (
                <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {displayUser.fullName || displayUser.name}
                </h1>
              )}
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-[7px] md:text-[8px] font-black text-primary uppercase tracking-[0.2em] backdrop-blur-sm">
                  {displayUser.roleName}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[7px] md:text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Panel - Compact Grid */}
          <Card className="w-full border-none bg-card/60 backdrop-blur-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/5">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 bg-gradient-to-b from-primary/5 to-transparent relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg md:text-xl font-black tracking-tight text-foreground">
                  Account Overview
                </CardTitle>
                
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => setIsEditing(false)}
                        className="bg-transparent border-border text-foreground hover:bg-muted font-black px-4 py-2 h-8 rounded-xl transition-all text-[8px] uppercase tracking-widest"
                      >
                        <X className="w-3 h-3 mr-1.5" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-primary text-white hover:bg-primary/90 font-black px-6 py-2 h-8 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] active:scale-95 group relative overflow-hidden text-[8px] uppercase tracking-widest min-w-[110px]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1.5" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleEditToggle}
                      className="bg-primary text-white hover:bg-primary/90 font-black px-6 py-2 h-8 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] active:scale-95 group relative overflow-hidden text-[8px] uppercase tracking-widest"
                    >
                      <Edit2 className="w-3 h-3 mr-1.5 group-hover:rotate-12 transition-transform" />
                      Update Details
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 max-w-3xl mx-auto">
                <DetailItem 
                  icon={User} 
                  label="Full Name" 
                  value={displayUser.fullName || displayUser.name} 
                  field="fullName" 
                  isEditing={isEditing}
                  editValue={editData.fullName}
                  onChange={(val) => setEditData({ ...editData, fullName: val })}
                  error={errors.fullName}
                />
                <DetailItem 
                  icon={Mail} 
                  label="Email Address" 
                  value={displayUser.email} 
                  field="email" 
                  isEditing={isEditing}
                  editValue={editData.email}
                  onChange={handleEmailChange}
                  error={errors.email}
                />

                <DetailItem 
                  icon={Shield} 
                  label="Account Role" 
                  value={displayUser.roleName} 
                  field="roleName" 
                  isEditing={isEditing}
                />
                <DetailItem 
                  icon={Phone} 
                  label="Phone Number" 
                  value={displayUser.mobileNumber} 
                  field="mobileNumber" 
                  isEditing={isEditing}
                  editValue={editData.mobileNumber}
                  onChange={handleMobileChange}
                  error={errors.mobileNumber}
                  maxLength={10}
                />



                <DetailItem 
                  icon={Calendar} 
                  label="Member Since" 
                  value={new Date(displayUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
                  field="createdAt" 
                  isEditing={isEditing}
                />
                <DetailItem 
                  icon={MapPin} 
                  label="Location" 
                  value={displayUser.address} 
                  field="address" 
                  isEditing={isEditing}
                  editValue={editData.address}
                  onChange={(val) => setEditData({ ...editData, address: val })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
