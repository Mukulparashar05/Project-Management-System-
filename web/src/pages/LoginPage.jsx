import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Feedback.jsx';
import { PasswordField, TextField } from '../components/ui/Field.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { validateLogin } from '../utils/validation.js';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, sessionNotice } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateLogin(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      toast.success('Welcome back.');
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {});
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Manage projects."
      highlight="Ship faster."
      description="Plan projects, organize tasks, and track progress from anywhere, on the web or on Android."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-label="Log in">
        {sessionNotice && <Alert tone="warning">{sessionNotice}</Alert>}
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={values.email}
          onChange={handleChange('email')}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={handleChange('password')}
          error={fieldErrors.password}
        />

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-7 text-sm text-zinc-400">
        New to Orbit?{' '}
        <Link to="/register" className="font-medium text-indigo-300 transition-colors hover:text-indigo-200">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
