import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChangePasswordDialog from "./ChangePasswordDialog";

export default function FirstLoginPasswordCheck() {
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.must_change_password === true) {
      setShowPasswordDialog(true);
    } else {
      setShowPasswordDialog(false);
    }
  }, [user]);

  const handlePasswordChanged = () => {
    setShowPasswordDialog(false);
    window.location.reload(); // Reload to refresh user data
  };

  return (
    <ChangePasswordDialog 
      open={showPasswordDialog} 
      onPasswordChanged={handlePasswordChanged}
    />
  );
}
