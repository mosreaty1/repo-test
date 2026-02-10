import React from 'react';
import { useApp } from './store.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import DataManagement from './components/DataManagement.jsx';
import Reports from './components/Reports.jsx';
import ChangeLog from './components/ChangeLog.jsx';

export default function App() {
  const { currentPage } = useApp();

  const pages = {
    dashboard: <Dashboard />,
    schedule: <ScheduleView />,
    reports: <Reports />,
    changelog: <ChangeLog />,
    data: <DataManagement />,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Navbar />
      <main className="pt-2">
        {pages[currentPage] || <Dashboard />}
      </main>
    </div>
  );
}
