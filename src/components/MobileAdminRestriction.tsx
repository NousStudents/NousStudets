import { useIsMobile } from "@/hooks/use-mobile";
import { Laptop, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MobileAdminRestrictionProps {
  children: React.ReactNode;
  action?: string;
}

export const MobileAdminRestriction = ({ 
  children, 
  action = "perform management actions" 
}: MobileAdminRestrictionProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-600">Desktop Required</AlertTitle>
        <AlertDescription className="text-yellow-600/90">
          <div className="flex items-start gap-2 mt-2">
            <Laptop className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>
              To {action}, please use a laptop or desktop computer. You can view data on mobile, but management features are only available on larger screens.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
