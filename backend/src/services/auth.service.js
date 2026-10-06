import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from './token.service.js';
import { publicUserSelect } from './user.service.js';

let dummyHashPromise;

// Comparing against a throwaway hash when the email is unknown keeps response times
// similar for existing and non-existing accounts (no user enumeration by timing).
function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash(randomUUID(), env.BCRYPT_SALT_ROUNDS);
  return dummyHashPromise;
}

function isUniqueEmailViolation(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    String(error.meta?.target ?? '').includes('email')
  );
}

export async function registerUser({ fullName, email, password }) {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  try {
    // The unique index is the source of truth, which also covers concurrent sign-ups.
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash },
      select: publicUserSelect,
    });
    return { user, token: signAccessToken(user.id) };
  } catch (error) {
    if (isUniqueEmailViolation(error)) {
      throw AppError.conflict('An account with this email already exists', 'EMAIL_IN_USE');
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const { passwordHash: _omit, ...publicUser } = user;
  return { user: publicUser, token: signAccessToken(user.id) };
}
