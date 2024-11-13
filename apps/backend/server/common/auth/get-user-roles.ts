import prisma from "../../common/prisma.ts";

export async function getUserRoles(
  user: Express.User | undefined
): Promise<string[]> {
  if (!user) {
    return [];
  }

  const dbUser = await prisma.user.findFirstOrThrow({
    where: {
      id: user.id,
    },
    select: {
      roles: { select: { role: { select: { code: true } } } },
    },
  });

  const roles = dbUser.roles
    .map((role) => {
      return { ...role.role };
    })
    .map((r) => r.code);

  return roles;
}
