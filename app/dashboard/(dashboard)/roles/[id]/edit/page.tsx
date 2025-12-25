import { getRoleById, updateRole, assignPermissionsToRole } from '@/app/actions/permissions/role-actions';
import { getAllPermissions } from '@/app/actions/permissions/permission-actions';
import RoleEditForm from './role-edit-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const roleId = resolvedParams.id;

  const [roleResult, permissionsResult] = await Promise.all([
    getRoleById(roleId),
    getAllPermissions(),
  ]);

  if (!roleResult.success || !roleResult.role) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Role Not Found</h1>
          <p className="text-muted-foreground">The role you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <RoleEditForm
      role={roleResult.role}
      allPermissions={permissionsResult.permissions || []}
    />
  );
}

