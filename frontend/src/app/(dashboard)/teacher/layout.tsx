import { AuthGuard } from "@/components/AuthGuard";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["teacher"]}>
      {children}
    </AuthGuard>
  );
}
