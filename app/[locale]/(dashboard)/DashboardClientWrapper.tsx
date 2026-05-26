"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { Profile } from '@/types';

export default function DashboardClientWrapper({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    useAuthStore.getState().setProfile(profile);
  }, [profile]);

  // Preloader is handled in its own component and store independently.
  
  return <>{children}</>;
}
