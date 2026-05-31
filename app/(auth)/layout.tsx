export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        href="/login-bg.webp"
        as="image"
        type="image/webp"
      />
      {children}
    </>
  );
}
