import { getUserById } from "@/app/actions/permissions/user-actions";
import { getAllRoles } from "@/app/actions/permissions/role-actions";
import { getAllPermissions } from "@/app/actions/permissions/permission-actions";
import UserEditForm from "./user-edit-form";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.id;

  const [userResult, rolesResult, permissionsResult] = await Promise.all([
    getUserById(userId),
    getAllRoles(),
    getAllPermissions(),
  ]);

  if (!userResult.success || !userResult.user) {
    notFound();
  }

  return (
    <UserEditForm
      user={userResult.user}
      allRoles={rolesResult.roles || []}
      allPermissions={permissionsResult.permissions || []}
    />
  );
}

