import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { TextLink } from '../components/auth/TextLink';
import { Button } from '../components/ui/Button';
import { InlineMessage } from '../components/ui/StateViews';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';
import { PASSWORD_RULES, validateRegistration } from '../utils/validation';

const EMPTY_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

function PasswordChecklist({ password }) {
  return (
    <View style={styles.checklist} accessibilityLabel="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.id} style={styles.rule} accessible accessibilityLabel={`${rule.label}: ${met ? 'met' : 'not met'}`}>
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={met ? colors.success : colors.textSubtle}
            />
            <Text style={[styles.ruleText, met && styles.ruleMet]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const update = (field) => (text) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit() {
    const validationErrors = validateRegistration(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (error) {
      if (error.code === 'EMAIL_IN_USE') {
        setErrors({ email: error.message });
      } else {
        setErrors(error.fieldErrors ?? {});
        setFormError(error.message);
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Create your account."
      highlight="Into orbit."
      description="One account for the Orbit web and Android apps."
      footer={<TextLink prefix="Already have an account?" label="Sign in" onPress={() => navigation.goBack()} />}
    >
      <View style={styles.form}>
        <InlineMessage message={formError} />
        <TextField
          label="Full name"
          value={values.fullName}
          onChangeText={update('fullName')}
          error={errors.fullName}
          placeholder="Ada Lovelace"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={emailRef}
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
        <View style={styles.passwordGroup}>
          <TextField
            ref={passwordRef}
            label="Password"
            value={values.password}
            onChangeText={update('password')}
            error={errors.password}
            placeholder="Create a password"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            submitBehavior="submit"
          />
          <PasswordChecklist password={values.password} />
        </View>
        <TextField
          ref={confirmRef}
          label="Confirm password"
          value={values.confirmPassword}
          onChangeText={update('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <Button
          title={submitting ? 'Creating account…' : 'Create account'}
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
  passwordGroup: { gap: 10 },
  checklist: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { fontSize: 12, color: colors.textSubtle },
  ruleMet: { color: colors.success },
  submit: { marginTop: 8 },
});
