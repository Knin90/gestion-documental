export const dynamic = "force-dynamic";

import ProtectedLayoutClient from "./protected-layout-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
