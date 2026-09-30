import RotateDevicePrompt from "@/components/RotateDevicePrompt";

// No celular o app é usado deitado (paisagem): o aviso aparece em todas as telas do app.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <RotateDevicePrompt />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
