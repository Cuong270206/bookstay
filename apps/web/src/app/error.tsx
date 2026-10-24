'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">:(</h1>
        <h2 className="text-2xl font-semibold mb-2">Đã có lỗi xảy ra</h2>
        <p className="text-gray-500 mb-6">
          Chúng tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Thử lại</Button>
          <Link href="/home">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
