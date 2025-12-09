import { Layout } from '@/components/layout/Layout';
import { AuthForm } from '@/components/auth/AuthForm';

export default function Login() {
  return (
    <Layout>
      <AuthForm mode="login" />
    </Layout>
  );
}