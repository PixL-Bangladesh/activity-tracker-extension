import { Route, Routes } from 'react-router-dom';
import SidebarWithHeader from '~/components/ui/sidebar-with-header';
import { SessionList } from './SessionList.tailwind';
import { List, Settings } from 'lucide-react';
import Player from './Player.tailwind';

export default function App() {
  return (
    <SidebarWithHeader
      title="Sessions"
      headBarItems={[
        {
          label: 'Settings',
          icon: Settings,
          href: '/options/index.html#',
        },
        {
          label: 'Sessions',
          icon: List,
          href: '#',
        },
      ]}
      sideBarItems={[
        {
          label: 'List',
          icon: List,
          href: `#`,
        },
      ]}
    >
      <Routes>
        <Route path="/" element={<SessionList />} />
        <Route path="player/:sessionId" element={<Player />} />
      </Routes>
    </SidebarWithHeader>
  );
}
