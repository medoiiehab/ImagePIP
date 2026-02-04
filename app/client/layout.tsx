export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="client-layout">
      {/* Client UI elements */}
      <main>{children}</main>
    </div>
  );
}
