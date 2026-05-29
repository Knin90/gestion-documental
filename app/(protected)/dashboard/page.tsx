import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#053931] mx-auto flex items-center justify-center">
          <span className="text-[#CBEFEB] text-2xl font-bold">GD</span>
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Bienvenido</h1>
        <p className="text-muted-foreground">
          Sesión iniciada como{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded-md bg-[#053931] text-[#CBEFEB] text-sm font-medium hover:bg-[#00524D] transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
