// Client-side checks mirror the API rules for fast feedback. The API re-validates everything.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: 'At least one number', test: (value) => /\d/.test(value) },
];

function validateEmail(email) {
  const value = email.trim();
  if (!value) return 'Email is required';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address';
  return null;
}

function collect(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function validateLogin({ email, password }) {
  return collect({
    email: validateEmail(email),
    password: password ? null : 'Password is required',
  });
}

function validateName(name, label, maxLength) {
  const value = name.trim();
  if (!value) return `${label} is required`;
  if (value.length > maxLength) return `${label} must be at most ${maxLength} characters`;
  return null;
}

function validateNewPassword(password) {
  if (!password) return 'Password is required';
  if (new TextEncoder().encode(password).length > 72) return 'Password must be at most 72 bytes';
  const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failedRule ? `Password needs ${failedRule.label.toLowerCase()}` : null;
}

export function validateRegistration({ fullName, email, password, confirmPassword }) {
  return collect({
    fullName: validateName(fullName, 'Full name', 100),
    email: validateEmail(email),
    password: validateNewPassword(password),
    confirmPassword: confirmPassword !== password ? 'Passwords do not match' : null,
  });
}

export function validateProject({ name, description, startDate, endDate }) {
  return collect({
    name: validateName(name, 'Project name', 120),
    description: description.length > 2000 ? 'Description must be at most 2000 characters' : null,
    endDate:
      startDate && endDate && startDate > endDate ? 'End date must be on or after the start date' : null,
  });
}

export function validateTask({ name, description }) {
  return collect({
    name: validateName(name, 'Task name', 160),
    description: description.length > 2000 ? 'Description must be at most 2000 characters' : null,
  });
}
