export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A verificação de permissão foi movida para componentes específicos e para 
  // o Client/Server side da página, permitindo que a Dashboard seja visível
  // para usuários "Free" comprarem o "Pro".
  return (
    <>
      {children}
    </>
  );
}
