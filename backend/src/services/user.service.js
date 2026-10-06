import { prisma } from '../config/prisma.js';

// The only user fields that ever leave the API. password_hash is never selected for responses.
export const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

export function findPublicUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
