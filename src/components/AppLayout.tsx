import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border/50 glass-heavy backdrop-blur-xl shadow-glass px-3 sm:px-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
