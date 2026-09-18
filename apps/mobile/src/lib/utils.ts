export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#10b981',
    CANCELLED: '#ef4444',
    COMPLETED: '#3b82f6',
    REFUNDED: '#8b5cf6',
    PUBLISHED: '#10b981',
    PENDING_REVIEW: '#f59e0b',
    SUSPENDED: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
    REFUNDED: 'Đã hoàn tiền',
    PUBLISHED: 'Đang hoạt động',
    PENDING_REVIEW: 'Chờ duyệt',
    NEEDS_EDIT: 'Cần chỉnh sửa',
    SUSPENDED: 'Bị đình chỉ',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
  };
  return labels[status] || status;
}
