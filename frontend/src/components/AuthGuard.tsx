'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // mounted 保证客户端首次渲染和 SSR 一致（都返回 null），避免 hydration 不匹配
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // SSR 和客户端首次渲染都返回 null；挂载后若已登录才渲染子内容
  if (!mounted) return null;
  if (!isAuthenticated()) return null;

  return <>{children}</>;
}