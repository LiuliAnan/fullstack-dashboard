'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { clearToken } from '@/lib/auth';

const NAV_TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Company', path: '/company' },
  { label: 'Order', path: '/order' },
  { label: 'User', path: '/user' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = NAV_TABS.findIndex((tab) => tab.path === pathname);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    router.push(NAV_TABS[newValue].path);
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Tabs
          value={activeTab >= 0 ? activeTab : false}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ flexGrow: 1 }}
        >
          {NAV_TABS.map((tab) => (
            <Tab key={tab.path} label={tab.label} />
          ))}
        </Tabs>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
