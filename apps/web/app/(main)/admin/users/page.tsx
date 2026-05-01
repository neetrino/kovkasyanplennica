'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import { AdminNumericPagination } from '../components/AdminNumericPagination';
import {
  adminBulkDangerButtonClass,
  adminFilterLabelClass,
  adminFormControlClass,
  adminPaginationMetaClass,
  adminSolidButtonClass,
  dashboardEmptyText,
  dashboardMainClass,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
  dashboardCardPadding,
  adminTableBodyClass,
  adminTableHeadCellClass,
  adminTableHeadRowClass,
  adminTableRowHoverClass,
  adminTableWrapClass,
} from '../components/dashboardUi';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: string[];
  blocked: boolean;
  ordersCount?: number;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function getRoleBadgeClassName(role: string): string {
  if (role === 'admin') {
    return 'rounded-full bg-admin-warm/50 px-2 py-1 text-xs font-medium text-admin-brand ring-1 ring-inset ring-admin-brand/12';
  }
  if (role === 'customer') {
    return 'rounded-full bg-admin-surface px-2 py-1 text-xs font-medium text-admin-brand ring-1 ring-inset ring-admin-brand-2/18';
  }
  return 'rounded-full bg-admin-surface px-2 py-1 text-xs font-medium text-admin-muted ring-1 ring-inset ring-admin-brand-2/14';
}

function messageFromUnknownError(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string' && m.length > 0) {
      return m;
    }
  }
  return fallback;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👥 [ADMIN] Fetching users...', { page, search, roleFilter });

      const response = await apiClient.get<UsersResponse>('/api/v1/admin/users', {
        params: {
          page: page.toString(),
          limit: '20',
          search: search || '',
          role: roleFilter === 'all' ? '' : roleFilter,
        },
      });

      console.log('✅ [ADMIN] Users fetched:', response);
      setUsers(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, page, search, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleUsers =
      roleFilter === 'all'
        ? users
        : users.filter((u) =>
            roleFilter === 'admin' ? u.roles?.includes('admin') : u.roles?.includes('customer'),
          );

    if (visibleUsers.length === 0) return;

    setSelectedIds((prev) => {
      const allIds = visibleUsers.map((u) => u.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.users.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(ids.map((id) => apiClient.delete(`/api/v1/admin/users/${id}`)));
      const failed = results.filter((r) => r.status === 'rejected');
      setSelectedIds(new Set());
      await fetchUsers();
      alert(
        t('admin.users.bulkDeleteFinished')
          .replace('{success}', (ids.length - failed.length).toString())
          .replace('{total}', ids.length.toString()),
      );
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete users error:', err);
      alert(t('admin.users.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleBlocked = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      const newStatus = !currentStatus;
      await apiClient.put(`/api/v1/admin/users/${userId}`, {
        blocked: newStatus,
      });

      console.log(`✅ [ADMIN] User ${newStatus ? 'blocked' : 'unblocked'} successfully`);

      fetchUsers();

      if (newStatus) {
        alert(t('admin.users.userBlocked').replace('{name}', userName));
      } else {
        alert(t('admin.users.userActive').replace('{name}', userName));
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error updating user status:', err);
      alert(
        t('admin.users.errorUpdatingStatus').replace(
          '{message}',
          messageFromUnknownError(err, t('admin.common.unknownErrorFallback')),
        ),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const filteredUsers =
    roleFilter === 'all'
      ? users
      : users.filter((user) =>
          roleFilter === 'admin' ? user.roles?.includes('admin') : user.roles?.includes('customer'),
        );

  const rolePillBase = 'rounded-full px-3 py-1 text-xs font-medium transition-all';
  const rolePillActive = 'bg-white text-admin-brand shadow-sm ring-1 ring-admin-brand-2/18';
  const rolePillIdle = 'text-admin-brand/55 hover:text-admin-brand';

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.users.title')}</h1>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className={`${adminFormControlClass} min-w-0 flex-1`}
            />
            <button type="submit" className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-medium ${adminSolidButtonClass}`}>
              {t('admin.users.search')}
            </button>
          </div>

          <div>
            <span className={adminFilterLabelClass}>{t('admin.users.adminCustomer')}</span>
            <div className="inline-flex rounded-full bg-admin-surface p-1 text-xs ring-1 ring-inset ring-admin-brand-2/12">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('all');
                  setPage(1);
                  console.log('👥 [ADMIN] Role filter changed to: all');
                }}
                className={`${rolePillBase} ${roleFilter === 'all' ? rolePillActive : rolePillIdle}`}
              >
                {t('admin.users.all')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('admin');
                  setPage(1);
                  console.log('👥 [ADMIN] Role filter changed to: admin');
                }}
                className={`${rolePillBase} ${roleFilter === 'admin' ? rolePillActive : rolePillIdle}`}
              >
                {t('admin.users.admins')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('customer');
                  setPage(1);
                  console.log('👥 [ADMIN] Role filter changed to: customer');
                }}
                className={`${rolePillBase} ${roleFilter === 'customer' ? rolePillActive : rolePillIdle}`}
              >
                {t('admin.users.customers')}
              </button>
            </div>
          </div>
        </form>
      </Card>

      <Card variant="admin" className={dashboardCardPadding}>
        {loading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.users.loadingUsers')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center">
            <p className={dashboardEmptyText}>{t('admin.users.noUsers')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-admin-brand-2/15">
              <table className={adminTableWrapClass}>
                <thead className={adminTableHeadRowClass}>
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={t('admin.users.selectAll')}
                        checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                      />
                    </th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.user')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.contact')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.orders')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.roles')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.status')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.users.created')}</th>
                  </tr>
                </thead>
                <tbody className={adminTableBodyClass}>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={adminTableRowHoverClass}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={t('admin.users.selectUser').replace('{email}', user.email)}
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={dashboardRowPrimaryMedium}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className={dashboardRowMeta}>{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={dashboardRowPrimaryMedium}>{user.email}</div>
                        {user.phone ? <div className={dashboardRowMeta}>{user.phone}</div> : null}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${dashboardRowPrimaryMedium}`}>
                        {user.ordersCount ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {user.roles?.map((role) => (
                            <span key={role} className={`inline-flex items-center ${getRoleBadgeClassName(role)}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBlocked(user.id, user.blocked, `${user.firstName} ${user.lastName}`)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/35 focus-visible:ring-offset-2 ${
                            user.blocked ? 'bg-admin-brand-2/35' : 'bg-admin-brand'
                          }`}
                          title={user.blocked ? t('admin.users.clickToActivate') : t('admin.users.clickToBlock')}
                          role="switch"
                          aria-checked={!user.blocked}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              user.blocked ? 'translate-x-1' : 'translate-x-6'
                            }`}
                          />
                        </button>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${dashboardRowMeta}`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 ? (
              <AdminNumericPagination
                page={page}
                totalPages={meta.totalPages}
                onPageChange={(n) => setPage(n)}
                summary={t('admin.users.showingPage')
                  .replace('{page}', meta.page.toString())
                  .replace('{totalPages}', meta.totalPages.toString())
                  .replace('{total}', meta.total.toString())}
                previousLabel={t('admin.users.previous')}
                nextLabel={t('admin.users.next')}
              />
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-admin-brand-2/12 pt-4">
              <div className={adminPaginationMetaClass}>
                {t('admin.users.selectedUsers').replace('{count}', selectedIds.size.toString())}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className={adminBulkDangerButtonClass}
              >
                {bulkDeleting ? t('admin.users.deleting') : t('admin.users.deleteSelected')}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
