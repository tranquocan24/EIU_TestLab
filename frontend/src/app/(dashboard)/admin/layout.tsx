import { AuthGuard } from "@/components/AuthGuard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["admin"]}>
      {children}
    </AuthGuard>
  );
}
