import { Route, Routes } from "react-router-dom";
import SidebarWithHeader from "~/components/ui/sidebar-with-header";
import { List, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuthStatus } from "~/utils/auth";
import { toast } from "sonner";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headBarItems, setHeadBarItems] = useState([
    {
      label: "Settings",
      icon: Settings,
      href: "#",
    },
  ]);

  const fetchAuthStatus = async () => {
    try {
      const response = await getAuthStatus();
      if (response) {
        setIsAuthenticated(true);
        setHeadBarItems((prev) => [
          ...prev,
          {
            label: "Sessions",
            icon: List,
            href: "/pages/index.html#",
          },
        ]);
      } else {
        setIsAuthenticated(false);
        toast.error("You are not logged in");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Error fetching authentication status");
        console.error("Error fetching authentication status:", error);
      }
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  return (
    <SidebarWithHeader
      title="Settings"
      headBarItems={headBarItems}
      sideBarItems={[]}
    >
      <div className="p-10">
        <Routes>
          <Route path="/" element={<></>} />
        </Routes>
      </div>
    </SidebarWithHeader>
  );
}
