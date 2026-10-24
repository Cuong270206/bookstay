import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Không tìm thấy trang</h2>
        <p className="text-gray-500 mb-6">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/home"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
