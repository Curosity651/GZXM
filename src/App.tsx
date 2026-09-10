import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/AuthGuard';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { IndicatorConfigPage } from './pages/indicator/IndicatorConfigPage';
import { TopicIndicatorConfigPage } from './pages/indicator/TopicIndicatorConfigPage';
import { AchievementEntryPage } from './pages/achievement/AchievementEntryPage';
import { ArchiveMonitoringPage } from './pages/archive/ArchiveMonitoringPage';
import { TopicArchivePage } from './pages/archive/TopicArchivePage';
import { SelfFundedProjectPage } from './pages/archive/SelfFundedProjectPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { RolePermissionPage } from './pages/admin/RolePermissionPage';
import { ReportManagementPage } from './pages/report/ReportManagementPage';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#246fe5', borderRadius: 10, colorBgLayout: '#f3f6fb', fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' }, components: { Card: { headerFontSize: 16 }, Table: { headerBg: '#f7f9fc' } } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<HomePage />} />
            <Route path="indicator" element={<IndicatorConfigPage />} />
            <Route path="indicator/topic/:topicId" element={<TopicIndicatorConfigPage />} />
            <Route path="achievement-entry" element={<AchievementEntryPage />} />
            <Route path="achievement-approval" element={<Navigate to="/achievement-entry" replace />} />
            <Route path="achievement-query" element={<Navigate to="/achievement-entry" replace />} />
            <Route path="reports" element={<ReportManagementPage />} />
            <Route path="progress-overview" element={<Navigate to="/reports" replace />} />
            <Route path="report-approval" element={<Navigate to="/reports" replace />} />
            <Route path="archive/topics" element={<TopicArchivePage />} />
            <Route path="archive/self-funded" element={<SelfFundedProjectPage />} />
            <Route path="archive/monitoring" element={<ArchiveMonitoringPage />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/roles" element={<RolePermissionPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
