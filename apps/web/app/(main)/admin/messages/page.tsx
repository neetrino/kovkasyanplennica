'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import { AdminNumericPagination } from '../components/AdminNumericPagination';
import {
  adminBulkDangerButtonClass,
  adminPaginationMetaClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
  adminTableBodyClass,
  adminTableHeadCellClass,
  adminTableHeadRowClass,
  adminTableRowHoverClass,
  adminTableWrapClass,
} from '../components/dashboardUi';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface MessagesResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

export default function MessagesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MessagesResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📧 [ADMIN] Fetching messages...', { page });

      const response = await apiClient.get<MessagesResponse>('/api/v1/admin/messages', {
        params: {
          page: page.toString(),
          limit: '20',
        },
      });

      console.log('✅ [ADMIN] Messages fetched:', response);
      setMessages(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, page]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (messages.length === 0) return;
    setSelectedIds((prev) => {
      const allIds = messages.map((m) => m.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.messages.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/v1/admin/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          detail?: string;
          message?: string;
        };
        throw new Error(errorData.detail || errorData.message || 'Failed to delete messages');
      }

      setSelectedIds(new Set());
      await fetchMessages();
      alert(t('admin.messages.deletedSuccess'));
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Bulk delete messages error:', err);
      alert(
        `${t('admin.messages.failedToDelete')}: ${messageFromUnknownError(err, t('admin.common.unknownErrorFallback'))}`,
      );
    } finally {
      setBulkDeleting(false);
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

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.messages.title')}</h1>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        {loading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.messages.loadingMessages')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <p className={dashboardEmptyText}>{t('admin.messages.noMessages')}</p>
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
                        aria-label={t('admin.messages.selectAll')}
                        checked={messages.length > 0 && messages.every((m) => selectedIds.has(m.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                      />
                    </th>
                    <th className={adminTableHeadCellClass}>{t('admin.messages.name')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.messages.email')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.messages.subject')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.messages.message')}</th>
                    <th className={adminTableHeadCellClass}>{t('admin.messages.date')}</th>
                  </tr>
                </thead>
                <tbody className={adminTableBodyClass}>
                  {messages.map((msg) => (
                    <tr key={msg.id} className={adminTableRowHoverClass}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={t('admin.messages.selectMessage').replace('{email}', msg.email)}
                          checked={selectedIds.has(msg.id)}
                          onChange={() => toggleSelect(msg.id)}
                          className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={dashboardRowPrimaryMedium}>{msg.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={dashboardRowPrimaryMedium}>{msg.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={dashboardRowPrimaryMedium}>{msg.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`max-w-md truncate ${dashboardRowPrimaryMedium}`}>{msg.message}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${dashboardRowMeta}`}>
                        {new Date(msg.createdAt).toLocaleDateString()}
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
                summary={t('admin.messages.showingPage')
                  .replace('{page}', meta.page.toString())
                  .replace('{totalPages}', meta.totalPages.toString())
                  .replace('{total}', meta.total.toString())}
                previousLabel={t('admin.messages.previous')}
                nextLabel={t('admin.messages.next')}
              />
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-admin-brand-2/12 pt-4">
              <div className={adminPaginationMetaClass}>
                {t('admin.messages.selectedMessages').replace('{count}', selectedIds.size.toString())}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className={adminBulkDangerButtonClass}
              >
                {bulkDeleting ? t('admin.messages.deleting') : t('admin.messages.deleteSelected')}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
