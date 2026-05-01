'use client';

import { useTranslation } from '@/lib/i18n-client';
import { Card, Button } from '@shop/ui';
import {
  adminBulkDangerButtonClass,
  dashboardCardPadding,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';

interface BulkSelectionControlsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
}

export function BulkSelectionControls({
  selectedCount,
  onBulkDelete,
  bulkDeleting,
}: BulkSelectionControlsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`text-sm ${dashboardRowPrimaryMedium}`}>
          {t('admin.orders.selectedOrders').replace('{count}', selectedCount.toString())}
        </div>
        <Button
          variant="outline"
          onClick={onBulkDelete}
          disabled={bulkDeleting}
          className={adminBulkDangerButtonClass}
        >
          {bulkDeleting ? t('admin.orders.deleting') : t('admin.orders.deleteSelected')}
        </Button>
      </div>
    </Card>
  );
}





