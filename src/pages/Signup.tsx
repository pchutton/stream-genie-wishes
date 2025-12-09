import { Layout } from '@/components/layout/Layout';
import { AuthForm } from '@/components/auth/AuthForm';

export default function Signup() {
  return (
    <Layout>
      <AuthForm mode="signup" />
    </Layout>
  );
}