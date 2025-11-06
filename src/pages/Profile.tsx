import { BookOpen, Camera, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-gradient-primary text-white px-6 py-2 rounded-full shadow-lg">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-base">Students App</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>

        {/* Profile Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-3">Alex Sharma</h2>
          <p className="text-sm text-muted-foreground">Roll No: S-12345</p>
        </div>

        {/* Student Profile */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Student Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input 
              placeholder="Full Name" 
              className="bg-secondary/20 border-none rounded-2xl px-4 py-6 placeholder:text-foreground/60"
              defaultValue="Full Name"
            />
            <Input 
              placeholder="Email" 
              className="bg-secondary/20 border-none rounded-2xl px-4 py-6 placeholder:text-foreground/60"
              defaultValue="Email"
            />
          </div>
        </div>

        {/* Account Security */}
        <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Account Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Two-Factor Authentication</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Dark Mode</span>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Parent Account */}
        <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Parent Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Link Park Mode</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Authenicacs</span>
              <Switch />
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
