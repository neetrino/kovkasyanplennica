'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient } from '../../../lib/api-client';

interface Reservation {
  id: string;
  tableId: string;
  tableLabel: string;
  tableSeats: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guestCount: number;
  note: string | null;
  status: string;
  createdAt: string;
}

interface ReservationsResponse {
  data: Reservation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասում',
  confirmed: 'Հաստատված',
  cancelled: 'Չեղարկված',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function AdminDesktopsPage() {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ReservationsResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      if (filterStatus) params.status = filterStatus;

      const response = await apiClient.get<ReservationsResponse>(
        '/api/v1/admin/reservations',
        { params }
      );
      setReservations(response.data || []);
      setMeta(response.meta || null);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchReservations();
    }
  }, [isLoggedIn, isAdmin, fetchReservations]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (reservations.length === 0) return;
    setSelectedIds(prev => {
      const allIds = reservations.map(r => r.id);
      const hasAll = allIds.every(id => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/v1/admin/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchReservations();
    } catch {
      alert('Չհաջողվեց թարմացնել կարգավիճակը');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ջնջե՞լ ${selectedIds.size} ամրագրում(ներ)ը`)) return;
    setBulkDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/v1/admin/reservations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedIds(new Set());
      await fetchReservations();
    } catch {
      alert('Ջնջումը ձախողվեց');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Վերադառնալ
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Սեղանների ամրագրումներ</h1>
              {meta && (
                <p className="text-gray-500 text-sm mt-1">Ընդամենը {meta.total} ամրագրում</p>
              )}
            </div>
            {/* Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Կարգավիճակ</label>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Բոլորը</option>
                <option value="pending">Սպասում</option>
                <option value="confirmed">Հաստատված</option>
                <option value="cancelled">Չեղարկված</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Բեռնվում է...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Ամրագրումներ չկան</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        aria-label="Ընտրել բոլորը"
                        checked={reservations.length > 0 && reservations.every(r => selectedIds.has(r.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Սեղան</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Անուն</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Հեռախոս</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ամսաթիվ / Ժամ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Հյուրեր</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Կարգ.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Գրանցում</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {reservations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Ընտրել ${r.firstName} ${r.lastName}`}
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">{r.tableLabel}</div>
                        <div className="text-xs text-gray-400">{r.tableSeats} հոգի</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</div>
                        {r.note && (
                          <div className="text-xs text-gray-400 max-w-[180px] truncate" title={r.note}>
                            {r.note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{r.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{r.phone}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{r.date}</div>
                        <div className="text-xs text-gray-500">{r.time}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-center">{r.guestCount}</td>
                      <td className="px-4 py-4">
                        <select
                          value={r.status}
                          disabled={updatingId === r.id}
                          onChange={e => handleStatusChange(r.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          <option value="pending">Սպասում</option>
                          <option value="confirmed">Հաստատված</option>
                          <option value="cancelled">Չեղարկված</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('hy-AM')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination + bulk actions */}
          {!loading && reservations.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {selectedIds.size} ընտրված
                </span>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="px-4 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {bulkDeleting ? 'Ջնջվում...' : 'Ջնջել ընտրվածները'}
                  </button>
                )}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
