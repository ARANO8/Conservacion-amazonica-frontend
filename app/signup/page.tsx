import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Registro deshabilitado - redirigir al login
  redirect('/login');
}
