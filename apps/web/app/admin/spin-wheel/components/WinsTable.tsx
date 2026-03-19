'use client';

import type { SpinWinRow } from '../spin-wheel-admin.types';
interface WinsTableProps {
  wins: SpinWinRow[];
  onDeleteWin: (winId: string) => void;
  t: (key: string) => string;
}

export function WinsTable({ wins, onDeleteWin, t }: WinsTableProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('admin.spinWheel.winsTitle')}
      </h2>
      <div className="overflow-x-auto">
        {wins.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.spinWheel.noWins')}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.spinWheel.winsUser')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.spinWheel.winsContact')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.spinWheel.winsProduct')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.spinWheel.winsDate')}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.spinWheel.winsActions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wins.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.userName || row.userId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.userEmail || row.userPhone || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.productTitle ?? row.productId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteWin(row.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
                    >
                      {t('admin.common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
