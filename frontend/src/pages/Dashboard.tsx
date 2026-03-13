import React from "react";
import introJs from "intro.js";
import "intro.js/introjs.css"; // Explicitly import CSS
import { Building2, Users, ArrowUpRight, Layers, Home, ExternalLink, Calendar, Search, CircleHelp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ThemeToggle from "../components/ui/ThemeToggle";

const Dashboard = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const [stats, setStats] = React.useState({
    societiesCount: 0,
    membersCount: 0,
    activeWings: 0,
    totalFlats: 0,
    recentMembers: []
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [shouldStartTour, setShouldStartTour] = React.useState(false);

  // Helper for internal logging
  const addLog = (msg: string) => {
    // console.log(`[Dashboard Tour] ${msg}`); // Uncomment for debugging
  };

  const getAuthHeaders = () => ({
    "x-user-role": currentUser.roleName || "",
    "x-society-id": currentUser.societyId?.toString() || "",
    "x-member-id": currentUser.memberId?.toString() || "",
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats", { headers: getAuthHeaders() });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  React.useEffect(() => {
    fetchStats();
    // Auto-start tour if not seen
    const hasSeen = localStorage.getItem("hasSeenSetupFlow");
    if (!hasSeen) {
      addLog("Auto-triggering tour (not seen yet)");
      setShouldStartTour(true);
    }
  }, []);

  const tourRef = React.useRef<any>(null);
  const isProceedingRef = React.useRef(false);

  React.useEffect(() => {
    if (shouldStartTour && !isLoading) {
      addLog("Conditions met: Starting tour now");
      startTour();
      setShouldStartTour(false);
    } else if (shouldStartTour && isLoading) {
      addLog("Waiting for loading to finish before starting tour...");
    }
  }, [shouldStartTour, isLoading]);

  React.useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.exit();
      }
    };
  }, []);

  React.useEffect(() => {
    const handleStartTour = () => {
      addLog("Event 'start-dashboard-tour' received");
      setShouldStartTour(true);
    };
    window.addEventListener('start-dashboard-tour', handleStartTour);
    return () => window.removeEventListener('start-dashboard-tour', handleStartTour);
  }, []);

  const startTour = () => {
    addLog("Executing startTour logic...");

    // Ensure we don't start multiple times or while loading
    if (isLoading) {
      addLog("Aborted: Still loading data");
      return;
    }

    if (tourRef.current && tourRef.current.currentStep() !== undefined) {
      addLog("Aborted: Tour already running");
      return;
    }

    addLog("Initializing Intro.js...");
    sessionStorage.setItem("tourFlow", "societies");
    localStorage.setItem("hasSeenSetupFlow", "true");
    isProceedingRef.current = false;

    // Debug: Check if elements exist
    const el1 = document.getElementById("tour-stat-societies");
    const el2 = document.getElementById("tour-stat-members");
    const el3 = document.getElementById("tour-stat-wings");
    const el4 = document.querySelector("[data-tour-id='menu-societies']");

    addLog(`Elements check: Societies=${!!el1}, Members=${!!el2}, Wings=${!!el3}, Menu=${!!el4}`);

    if (!el1 && !el4) {
      addLog("CRITICAL: Key tour elements missing from DOM!");
    }

    const steps: any[] = [
      { intro: "Welcome to Society Manager! This tour will guide you through setting up your society, wings, and members." },
      {
        element: "[data-tour-id='menu-dashboard']",
        title: "Dashboard",
        intro: "This is your dashboard where you can see a high-level overview of everything.",
        position: "right"
      },
      {
        element: "#tour-stat-societies",
        intro: "Here you can see the total number of societies registered."
      },
      {
        element: "#tour-stat-members",
        intro: "This shows the total count of registered members."
      },
      {
        element: "#tour-stat-wings",
        intro: "And here is the total active wings across all societies."
      },
      {
        element: "[data-tour-id='menu-societies']",
        intro: "Click here to manage societies. We'll go there next!",
        position: "right"
      }
    ];

    addLog(`Steps prepared: ${steps.length}`);
    try {
      const intro = introJs();

      intro.setOptions({
        steps: steps,
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        disableInteraction: false, // Allow interaction to see if it helps
      });

      intro.onchange(function (targetElement) {
        addLog(`Step changed to: ${this.currentStep()}`);
      });

      intro.oncomplete(function () {
        addLog("Tour completed. Navigating to /societies");
        isProceedingRef.current = true;
        navigate("/societies");
      });

      intro.onexit(function () {
        addLog("Tour exited/skipped.");
      });

      addLog("Calling intro.start()");
      intro.start();
      tourRef.current = intro;
    } catch (e: any) {
      addLog(`Error starting intro.js: ${e.message}`);
    }
  };

  React.useEffect(() => {
    const hasSeenSetupFlow = localStorage.getItem("hasSeenSetupFlow");
    if (!hasSeenSetupFlow && !isLoading) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <Layout>
      <div className="min-h-full bg-background">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pl-14 pr-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <div className="h-4 w-px bg-border hidden md:block" />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground md:h-9 md:w-9"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                {getInitials(currentUser.fullName || currentUser.email)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none">{currentUser.fullName || currentUser.email}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{currentUser.roleName}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Welcome Section */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
              <p className="text-muted-foreground">Manage your society operations and track member activities.</p>
            </div>
            <div className="flex items-center gap-3">

            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tour-stats">
            <StatCard
              id="tour-stat-societies"
              title="Total Societies"
              value={stats.societiesCount}
              icon={Building2}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatCard
              id="tour-stat-members"
              title="Total Members"
              value={stats.membersCount}
              icon={Users}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <StatCard
              id="tour-stat-wings"
              title="Active Wings"
              value={stats.activeWings}
              icon={Layers}
              color="text-indigo-500"
              bg="bg-indigo-500/10"
            />
            <StatCard
              title="Total Flats"
              value={stats.totalFlats}
              icon={Home}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Registrations */}
            <Card className="lg:col-span-2 border-border/50 shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Recent Registrations</CardTitle>
                  <CardDescription className="text-muted-foreground">Latest members joined in the last 30 days</CardDescription>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/members")}
                  className="text-primary font-medium"
                >
                  View all members
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {stats.recentMembers.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No recent registrations found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stats.recentMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/5">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.societyName} • {member.wingName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="hidden sm:inline-flex border-border/50 bg-background/50 font-medium">
                            {member.memberType}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions / Getting Started */}
            <div className="space-y-6">
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 dark:from-primary/20 dark:to-primary/5 text-primary-foreground dark:text-foreground relative overflow-hidden transition-all duration-300">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <CircleHelp className="w-32 h-32 text-white dark:text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-primary-foreground dark:text-foreground flex items-center gap-2">
                    Quick Start Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <p className="text-primary-foreground/90 dark:text-muted-foreground text-sm font-medium">
                    New to SocietyApp? Follow our interactive tour to learn how to manage societies, wings, and members efficiently.
                  </p>
                  <Button
                    onClick={startTour}
                    className="w-full bg-background text-primary hover:bg-background/90 border-none shadow-md font-bold dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30"
                    variant="outline"
                  >
                    Take the Tour
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-border/50 shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">System Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] dark:bg-primary/20">v1.0.4</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg, id }: any) => {
  return (
    <Card id={id} className="border-none shadow-sm bg-card hover:translate-y-[-2px] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;