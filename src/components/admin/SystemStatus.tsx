import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Lock, HardDrive, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ServiceStatus = "operational" | "degraded" | "outage";

interface Service {
  name: string;
  status: ServiceStatus;
  icon: React.ReactNode;
  lastChecked?: string;
}

interface HealthCheckResponse {
  database: ServiceStatus;
  authentication: ServiceStatus;
  storage: ServiceStatus;
  notifications: ServiceStatus;
  timestamp: string;
}

export const SystemStatus = () => {
  const [services, setServices] = useState<Service[]>([
    { name: "Database", status: "operational", icon: <Database className="h-4 w-4" /> },
    { name: "Authentication", status: "operational", icon: <Lock className="h-4 w-4" /> },
    { name: "File Storage", status: "operational", icon: <HardDrive className="h-4 w-4" /> },
    { name: "Notifications", status: "operational", icon: <Bell className="h-4 w-4" /> },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const { toast } = useToast();

  const fetchSystemStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://davjlszmguixtuavtrxh.supabase.co/functions/v1/system-health`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch system status");
      }

      const data: HealthCheckResponse = await response.json();
      
      setServices([
        { name: "Database", status: data.database, icon: <Database className="h-4 w-4" /> },
        { name: "Authentication", status: data.authentication, icon: <Lock className="h-4 w-4" /> },
        { name: "File Storage", status: data.storage, icon: <HardDrive className="h-4 w-4" /> },
        { name: "Notifications", status: data.notifications, icon: <Bell className="h-4 w-4" /> },
      ]);
      
      setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching system status:", error);
      toast({
        title: "Status Check Failed",
        description: "Unable to retrieve system status. Please try again.",
        variant: "destructive",
      });
      
      // Set all to unknown/degraded state on error
      setServices(prev => prev.map(s => ({ ...s, status: "degraded" as ServiceStatus })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchSystemStatus, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return "bg-success";
      case "degraded":
        return "bg-warning";
      case "outage":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded";
      case "outage":
        return "Outage";
      default:
        return "Unknown";
    }
  };

  const getStatusVariant = (status: ServiceStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "operational":
        return "default";
      case "degraded":
        return "secondary";
      case "outage":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">System Status</CardTitle>
          <CardDescription className="text-sm mt-1">
            Real-time platform health overview
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchSystemStatus}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                {service.icon}
              </div>
              <span className="font-medium text-sm">{service.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getStatusColor(service.status)}`} />
              <Badge variant={getStatusVariant(service.status)} className="text-xs">
                {getStatusText(service.status)}
              </Badge>
            </div>
          </div>
        ))}
        
        {lastUpdate && (
          <p className="text-xs text-muted-foreground text-right pt-2">
            Last updated: {lastUpdate}
          </p>
        )}
        
        {!lastUpdate && !isLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Status unavailable</p>
            <Button variant="outline" size="sm" onClick={fetchSystemStatus}>
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
