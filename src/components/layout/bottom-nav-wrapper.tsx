import { auth } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";

export async function BottomNavWrapper() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "MODERATOR";
  return (
    <BottomNav
      isLoggedIn={!!session}
      userRole={role}
      isAdmin={isAdmin}
    />
  );
}
