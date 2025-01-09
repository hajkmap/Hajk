import prisma from "../../common/prisma.ts";

export async function getUserRoles(
  user: Express.User | undefined
): Promise<{ id: string; code: string }[]> {
  if (!user) {
    return [];
  }

  const dbUser = await prisma.user.findFirstOrThrow({
    where: {
      id: user.id,
    },
    select: {
      roles: { select: { role: { select: { id: true, code: true } } } },
    },
  });

  const roles = dbUser.roles
    .map((role) => {
      return { ...role.role };
    })
    .map((r) => ({ id: r.id, code: r.code }));

  return roles;
}
