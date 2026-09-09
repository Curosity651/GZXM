import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/AuthGuard';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { IndicatorConfigPage } from './pages/indicator/IndicatorConfigPage';
import { WarningRulePage } from './pages/warning/WarningRulePage';
import { AchievementEntryPage } from './pages/achievement/AchievementEntryPage';
import { AchievementApprovalPage } from './pages/achievement/AchievementApprovalPage';
import { AchievementQueryPage } from './pages/achievement/AchievementQueryPage';
import { IndicatorMonitoringPage } from './pages/monitoring/IndicatorMonitoringPage';
import { ArchiveCatalogPage } from './pages/archive/ArchiveCatalogPage';
import { ArchiveMonitoringPage } from './pages/archive/ArchiveMonitoringPage';
import { ProjectPublicArchivePage } from './pages/archive/ProjectPublicArchivePage';
import { TopicArchivePage } from './pages/archive/TopicArchivePage';
import { SelfFundedProjectPage } from './pages/archive/SelfFundedProjectPage';
import { ArchiveApprovalPage } from './pages/archive/ArchiveApprovalPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { RolePermissionPage } from './pages/admin/RolePermissionPage';
import { ReportManagementPage } from './pages/report/ReportManagementPage';
import { ReportApprovalPage } from './pages/report/ReportApprovalPage';
import { ReportProgressPage } from './pages/report/ReportProgressPage';

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
            <Route path="warning-rules" element={<WarningRulePage />} />
            <Route path="achievement-entry" element={<AchievementEntryPage />} />
            <Route path="achievement-approval" element={<AchievementApprovalPage />} />
            <Route path="achievement-query" element={<AchievementQueryPage />} />
            <Route path="monitoring" element={<IndicatorMonitoringPage />} />
            <Route path="progress-overview" element={<ReportProgressPage />} />
            <Route path="reports" element={<ReportManagementPage />} />
            <Route path="report-approval" element={<ReportApprovalPage />} />
            <Route path="archive/catalog" element={<ArchiveCatalogPage />} />
            <Route path="archive/public" element={<ProjectPublicArchivePage />} />
            <Route path="archive/topics" element={<TopicArchivePage />} />
            <Route path="archive/self-funded" element={<SelfFundedProjectPage />} />
            <Route path="archive/approval" element={<ArchiveApprovalPage />} />
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
