// Client-side checks mirror the API rules for instant feedback; the API validates everything again.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_BYTES = 72;

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: 'At least one number', test: (value) => /\d/.test(value) },
];

function collect(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

function validateEmail(email) {
  const value = email.trim();
  if (!value) return 'Email is required';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address';
  return null;
}

function validateName(name, label, maxLength) {
  const value = name.trim();
  if (!value) return `${label} is required`;
  if (value.length > maxLength) return `${label} must be at most ${maxLength} characters`;
  return null;
}

// bcrypt only uses the first 72 bytes, so the limit is in UTF-8 bytes rather than characters.
function utf8ByteLength(value) {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

function validateNewPassword(password) {
  if (!password) return 'Password is required';
  if (utf8ByteLength(password) > MAX_PASSWORD_BYTES) return 'Password must be at most 72 bytes';
  const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failedRule ? `Password needs ${failedRule.label.toLowerCase()}` : null;
}

export function validateLogin({ email, password }) {
  return collect({
    email: validateEmail(email),
    password: password ? null : 'Password is required',
  });
}

export function validateRegistration({ fullName, email, password, confirmPassword }) {
  return collect({
    fullName: validateName(fullName, 'Full name', 100),
    email: validateEmail(email),
    password: validateNewPassword(password),
    confirmPassword: confirmPassword !== password ? 'Passwords do not match' : null,
  });
}

export function validateTask({ name, description }) {
  return collect({
    name: validateName(name, 'Task name', 160),
    description: description.length > 2000 ? 'Description must be at most 2000 characters' : null,
  });
}
