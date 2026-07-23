import { Container } from '@mui/material';
import AuthGuard from '@/components/AuthGuard';
import NavBar from '@/components/NavBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children}
      </Container>
    </AuthGuard>
  );
}