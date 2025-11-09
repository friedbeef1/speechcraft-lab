import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

export const AuthButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (user) {
      await signOut();
      navigate("/auth");
    } else {
      navigate("/auth");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleAuth}
      className="gap-2"
    >
      {user ? (
        <>
          <LogOut className="h-4 w-4" />
          Sign Out
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Sign In
        </>
      )}
    </Button>
  );
};