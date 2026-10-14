import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import MembersLogin from "./MembersLogin";
import { usePageMeta } from "@/hooks/usePageMeta";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
  }`;

const MembersLayout = () => {
  const { session, profile, loading, signOut } = useAuth();
  usePageMeta({
    title: "Members area | Kingston Bagpuize Cricket Club",
    description: "Log in to pay subs, buy club kit and see your payment history.",
    noIndex: true,
  });

  if (!supabase) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Members area coming soon</h1>
        <p className="text-muted-foreground">
          The members area hasn't been connected yet. Add the Supabase keys in Vercel to switch it on
          (see MEMBERS_SETUP.md).
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!session) return <MembersLogin />;

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{firstName ? `Hi ${firstName}` : "Members area"}</h1>
            <p className="text-primary-foreground/80 mt-1">{session.user.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={signOut}>
            <LogOut /> Log out
          </Button>
        </div>
      </section>

      <div className="border-b border-border bg-background">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto" aria-label="Members">
          <NavLink to="/members" end className={tabClass}>My family</NavLink>
          <NavLink to="/members/shop" className={tabClass}>Pay subs & buy kit</NavLink>
          {profile?.is_admin && <NavLink to="/members/admin" className={tabClass}>Committee</NavLink>}
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default MembersLayout;
