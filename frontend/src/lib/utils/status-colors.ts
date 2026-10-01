export interface StatusBadgeConfig {
  label: string;
  className: string;
  dotColor?: string;
}

/**
 * Returns Tailwind classNames for status pills
 */
export function getStatusConfig(status: string | null | undefined, entity: 'load' | 'lr' | 'bilty' | 'vehicle' | 'driver' | 'payment'): StatusBadgeConfig {
  const norm = (status || '').toLowerCase().replace(/\s+/g, '_');

  switch (entity) {
    case 'load':
      switch (norm) {
        case 'created':
        case 'draft':
          return { label: 'Created', className: 'bg-gray-100 text-gray-700 border border-gray-200' };
        case 'vehicle_assigned':
        case 'assigned':
          return { label: 'Vehicle Assigned', className: 'bg-blue-50 text-blue-700 border border-blue-200' };
        case 'loading':
          return { label: 'Loading', className: 'bg-yellow-50 text-yellow-800 border border-yellow-200' };
        case 'in_transit':
          return { label: 'In Transit', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
        case 'partially_delivered':
          return { label: 'Partially Delivered', className: 'bg-orange-50 text-orange-700 border border-orange-200' };
        case 'delivered':
        case 'completed':
          return { label: 'Delivered', className: 'bg-green-50 text-green-700 border border-green-200' };
        case 'closed':
          return { label: 'Closed', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
        case 'cancelled':
        case 'canceled':
          return { label: 'Cancelled', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
          return { label: status || 'Pending', className: 'bg-gray-100 text-gray-700' };
      }

    case 'lr':
      switch (norm) {
        case 'draft':
          return { label: 'Draft', className: 'bg-gray-100 text-gray-600 border border-gray-200' };
        case 'generated':
          return { label: 'Generated', className: 'bg-blue-50 text-blue-700 border border-blue-200' };
        case 'loaded':
          return { label: 'Loaded', className: 'bg-yellow-50 text-yellow-800 border border-yellow-200' };
        case 'in_transit':
          return { label: 'In Transit', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
        case 'partially_delivered':
          return { label: 'Partial Delivery', className: 'bg-orange-50 text-orange-700 border border-orange-200' };
        case 'delivered':
          return { label: 'Delivered', className: 'bg-green-50 text-green-700 border border-green-200' };
        case 'cancelled':
          return { label: 'Cancelled', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
          return { label: status || 'Draft', className: 'bg-gray-100 text-gray-600' };
      }

    case 'bilty':
      switch (norm) {
        case 'paid':
          return { label: 'Paid', className: 'bg-green-50 text-green-700 border border-green-200' };
        case 'to_pay':
          return { label: 'To Pay', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
        case 'to_be_billed':
          return { label: 'To Be Billed', className: 'bg-blue-50 text-blue-700 border border-blue-200' };
        default:
          return { label: status || 'Pending', className: 'bg-gray-100 text-gray-700' };
      }

    case 'vehicle':
    case 'driver':
      switch (norm) {
        case 'available':
          return { label: 'Available', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dotColor: 'bg-emerald-500' };
        case 'on_trip':
        case 'in_transit':
        case 'active':
          return { label: 'On Trip', className: 'bg-blue-50 text-blue-700 border border-blue-200', dotColor: 'bg-blue-500' };
        case 'under_maintenance':
        case 'maintenance':
          return { label: 'Maintenance', className: 'bg-amber-50 text-amber-700 border border-amber-200', dotColor: 'bg-amber-500' };
        case 'inactive':
        case 'out_of_service':
        case 'suspended':
          return { label: 'Inactive', className: 'bg-rose-50 text-rose-700 border border-rose-200', dotColor: 'bg-rose-500' };
        default:
          return { label: status || 'Unknown', className: 'bg-gray-100 text-gray-600' };
      }

    case 'payment':
      switch (norm) {
        case 'paid':
          return { label: 'Paid / Settled', className: 'bg-green-50 text-green-700 border border-green-200' };
        case 'partial':
          return { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 border border-amber-200' };
        case 'pending':
          return { label: 'Pending', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
          return { label: status || 'Pending', className: 'bg-gray-100 text-gray-600' };
      }

    default:
      return { label: status || '', className: 'bg-gray-100 text-gray-600' };
  }
}
