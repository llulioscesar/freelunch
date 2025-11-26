import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '../components/LoginForm';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    // Check if already authenticated
    const stored = localStorage.getItem('freelunch_auth');
    if (stored) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
