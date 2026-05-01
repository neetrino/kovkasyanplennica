/**
 * Order utilities - helper functions for order status colors and formatting
 */

/** Order status `<select>` surface — aligned with admin dashboard badge palette */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-admin-warm/60 text-admin-brand ring-1 ring-inset ring-admin-brand/10';
    case 'processing':
      return 'bg-admin-surface text-admin-brand ring-1 ring-inset ring-admin-brand/15';
    case 'completed':
      return 'bg-admin-surface text-admin-brand ring-1 ring-inset ring-emerald-700/15';
    case 'cancelled':
      return 'bg-red-50/95 text-red-900 ring-1 ring-inset ring-red-200/60';
    default:
      return 'bg-admin-surface text-admin-muted ring-1 ring-inset ring-admin-brand-2/14';
  }
}

export function getPaymentStatusColor(paymentStatus: string): string {
  switch (paymentStatus.toLowerCase()) {
    case 'paid':
      return 'bg-admin-surface text-admin-brand ring-1 ring-inset ring-admin-brand/12';
    case 'pending':
      return 'bg-admin-warm/60 text-admin-brand ring-1 ring-inset ring-admin-brand/10';
    case 'failed':
      return 'bg-red-50/95 text-red-900 ring-1 ring-inset ring-red-200/60';
    default:
      return 'bg-admin-surface text-admin-muted ring-1 ring-inset ring-admin-brand-2/14';
  }
}

/**
 * Helper function to get color hex/rgb from color name
 */
export function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    'beige': '#F5F5DC', 'black': '#000000', 'blue': '#0000FF', 'brown': '#A52A2A',
    'gray': '#808080', 'grey': '#808080', 'green': '#008000', 'red': '#FF0000',
    'white': '#FFFFFF', 'yellow': '#FFFF00', 'orange': '#FFA500', 'pink': '#FFC0CB',
    'purple': '#800080', 'navy': '#000080', 'maroon': '#800000', 'olive': '#808000',
    'teal': '#008080', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
    'silver': '#C0C0C0', 'gold': '#FFD700',
  };
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] || '#CCCCCC';
}





