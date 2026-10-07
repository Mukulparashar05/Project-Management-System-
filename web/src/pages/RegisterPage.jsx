import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Feedback.jsx';
import { PasswordField, TextField } from '../components/ui/Field.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { PASSWORD_RULES, validateRegistration } from '../utils/validation.js';

const EMPTY_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

function PasswordChecklist({ password }) {
  return (
    <ul className="grid gap-1.5 text-xs sm:grid-cols-3" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 transition-colors ${met ? 'text-emerald-300' : 'text-zinc-500'}`}
          >
            <Check className={`size-3.5 ${met ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true" />
            {rule.label}
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateRegistration(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success('Account created. Welcome to Orbit.');
    } catch (error) {
      if (error.code === 'EMAIL_IN_USE') {
        setFieldErrors({ email: error.message });
      } else {
        setFieldErrors(error.fieldErrors ?? {});
        setFormError(error.message);
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Bring every project"
      highlight="into orbit."
      description="Create your account to plan projects and track tasks on the web and on Android."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-label="Create account">
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={values.fullName}
          onChange={handleChange('fullName')}
          error={fieldErrors.fullName}
        />
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
        <div className="space-y-2.5">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={values.password}
            onChange={handleChange('password')}
            error={fieldErrors.password}
          />
          <PasswordChecklist password={values.password} />
        </div>
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-7 text-sm text-zinc-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-300 transition-colors hover:text-indigo-200">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
