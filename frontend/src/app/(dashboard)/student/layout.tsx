import { AuthGuard } from "@/components/AuthGuard";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["student"]}>
      {children}
    </AuthGuard>
  );
}
