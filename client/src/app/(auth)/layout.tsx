import { Card } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background-03.jpg')" }}
    >
      <Card
        padding="lg"
        className="w-full max-w-lg backdrop-blur-md bg-surface-elevated/80 border-border/50"
      >
        {children}
      </Card>
    </div>
  );
}
