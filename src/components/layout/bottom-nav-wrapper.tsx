import { auth } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";

export async function BottomNavWrapper() {
  const session = await auth();
  return (
    <BottomNav
      isLoggedIn={!!session}
      userRole={session?.user?.role as string | undefined}
    />
  );
}
