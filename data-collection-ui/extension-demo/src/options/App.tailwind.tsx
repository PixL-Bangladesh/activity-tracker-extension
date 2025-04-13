import { Route, Routes } from 'react-router-dom';
import SidebarWithHeader from '~/components/ui/sidebar-with-header';
import { List, Settings } from 'lucide-react';

export default function App() {
  return (
    <SidebarWithHeader
      title="Settings"
      headBarItems={[
        {
          label: 'Sessions',
          icon: List,
          href: '/pages/index.html#',
        },
        {
          label: 'Settings',
          icon: Settings,
          href: '#',
        },
      ]}
      sideBarItems={[]}
    >
      <div className="p-10">
        <Routes>
          <Route path="/" element={<></>} />
        </Routes>
      </div>
    </SidebarWithHeader>
  );
}
