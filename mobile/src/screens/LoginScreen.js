import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { TextLink } from '../components/auth/TextLink';
import { Button } from '../components/ui/Button';
import { InlineMessage } from '../components/ui/StateViews';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { validateLogin } from '../utils/validation';

export function LoginScreen({ navigation }) {
  const { login, notice } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef(null);

  const update = (field) => (text) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit() {
    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      // On success the navigator switches to the signed-in screens by itself.
      await login({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setErrors(error.fieldErrors ?? {});
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Manage projects."
      highlight="Ship faster."
      description="Plan projects, organize tasks, and track progress from anywhere."
      footer={
        <TextLink prefix="New to Orbit?" label="Create an account" onPress={() => navigation.navigate('Register')} />
      }
    >
      <View style={styles.form}>
        <InlineMessage tone="warning" message={notice} />
        <InlineMessage message={formError} />
        <TextField
          label="Email address"
          value={values.email}
          onChangeText={update('email')}
          error={errors.email}
          placeholder="you@company.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={values.password}
          onChangeText={update('password')}
          error={errors.password}
          placeholder="Your password"
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <Button
          title={submitting ? 'Signing in…' : 'Sign in'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submit}
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  submit: { marginTop: 8 },
});
