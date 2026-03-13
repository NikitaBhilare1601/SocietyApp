"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Mail, Lock, Users, BarChart3, Shield } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import ThemeToggle from "../components/ui/ThemeToggle";

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
        if (r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

const Login = () => {
  const { error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const logoSrc = "/logo-final.png";
  const [logoUrl, setLogoUrl] = useState<string>(logoSrc);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedPassword = localStorage.getItem("rememberedPassword");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      if (rememberedPassword) {
        setPassword(rememberedPassword);
      }
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    removeWhiteBackground(logoSrc).then((url) => {
      if (active) setLogoUrl(url);
    });
    return () => {
      active = false;
    };
  }, [logoSrc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store full user data in localStorage
        console.log("User object before saving to localStorage:", data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Remember Me logic
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
        }

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        error(data.message || "Invalid credentials. Please check your email and password.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      error("An error occurred during login. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-8 w-full">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-1 rounded-lg">
              <img src={logoUrl} alt="Society Manager" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">Society Manager</span>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Login to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-accent/50 border-border text-foreground placeholder-muted-foreground focus:ring-primary rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 bg-accent/50 border-border text-foreground placeholder-muted-foreground focus:ring-primary rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : (
                  "Log In"
                )}
              </Button>

              {/* Remember Me */}

              

              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </label>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-muted-foreground pt-4">
                Don't have an account?{" "}
                <a href="#" className="text-primary hover:underline font-semibold transition-all">
                  Sign Up
                </a>
              </p>
            </form>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50 transition-colors">
            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary" />
              Demo Credentials:
            </p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Super Admin:</span> <span className="font-medium text-foreground">admin@society.com / admin123</span></div>
              <div className="flex justify-between"><span>Society Admin:</span> <span className="font-medium text-foreground">secretary@society.com / sec123</span></div>
              <div className="flex justify-between"><span>Member:</span> <span className="font-medium text-foreground">member@society.com / mem123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
