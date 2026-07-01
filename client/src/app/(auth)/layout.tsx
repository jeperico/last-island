import { Card } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card padding="lg" className="w-full max-w-md">
        {children}
      </Card>
    </div>
  );
}
