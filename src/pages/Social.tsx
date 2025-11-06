import { BookOpen, Video, FileText, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Social() {
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

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Social</h1>

        {/* Join Live Class */}
        <Button className="w-full bg-gradient-primary text-white py-6 rounded-3xl shadow-lg hover:opacity-90 transition-opacity">
          <Video className="w-5 h-5 mr-2" />
          <span className="font-bold">Onin Live Class</span>
        </Button>

        {/* Study Group Chats */}
        <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
          <div className="flex items-center gap-3 mb-1">
            <Avatar className="w-12 h-12 border-2 border-warning">
              <AvatarFallback className="bg-warning/10 text-warning">
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">My Study Group Chats</h3>
              <p className="text-xs text-muted-foreground">Nons test tomorrow, 7 AM</p>
            </div>
            <Button size="sm" variant="secondary" className="rounded-full">
              View All
            </Button>
          </div>
        </Card>

        {/* Recent Notes Shared */}
        <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Recent Notes Shared</h3>
              <p className="text-xs text-muted-foreground">Nons test tomorrow 2028 / AM</p>
            </div>
            <Button size="sm" className="bg-primary text-white rounded-full">
              + Create Note
            </Button>
          </div>
        </Card>

        {/* Quick Links */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Quick Links</h3>
          <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">All Materials</h4>
                <p className="text-xs text-muted-foreground">AI Tutor</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">115 R02 I</p>
                <p className="text-xs text-muted-foreground">Meetings</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
