import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        title="Sair"
        className="rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}
