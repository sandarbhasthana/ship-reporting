import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayout, useNotificationProvider } from "@refinedev/antd";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import { ConfigProvider, App as AntdApp, Spin } from "antd";
import {
  DashboardOutlined,
  RocketOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  BankOutlined,
  AuditOutlined
} from "@ant-design/icons";
import { lazy, Suspense } from "react";

import { authProvider, dataProvider, accessControlProvider } from "./providers";
import { ThemeProvider, useTheme } from "./theme";
import { Header, CustomEmpty } from "./components";
import styles from "./App.module.css";

import "@refinedev/antd/dist/reset.css";
import "./theme/variables.css";
import "./theme/global.css";

// Lazy load page components for code splitting
const LoginPage = lazy(() =>
  import("./pages/login").then((m) => ({ default: m.LoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.ResetPasswordPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/dashboard").then((m) => ({ default: m.DashboardPage }))
);

// Settings pages
const OrganizationSettings = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.OrganizationSettings }))
);
const VesselSettings = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.VesselSettings }))
);
const VesselForm = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.VesselForm }))
);
const UserProfile = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.UserProfile }))
);

// Inspection pages
const InspectionList = lazy(() =>
  import("./pages/inspections").then((m) => ({ default: m.InspectionList }))
);
const InspectionForm = lazy(() =>
  import("./pages/inspections").then((m) => ({ default: m.InspectionForm }))
);
const InspectionView = lazy(() =>
  import("./pages/inspections").then((m) => ({ default: m.InspectionView }))
);

// User pages
const UserList = lazy(() =>
  import("./pages/users").then((m) => ({ default: m.UserList }))
);
const UserForm = lazy(() =>
  import("./pages/users").then((m) => ({ default: m.UserForm }))
);

// Organization pages (Super Admin)
const OrganizationList = lazy(() =>
  import("./pages/organizations").then((m) => ({ default: m.OrganizationList }))
);
const OrganizationForm = lazy(() =>
  import("./pages/organizations").then((m) => ({ default: m.OrganizationForm }))
);

// Audit Log pages (Admin/Super Admin)
const AuditLogList = lazy(() =>
  import("./pages/audit-logs").then((m) => ({ default: m.AuditLogList }))
);

// Loading spinner for lazy loaded components
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50vh"
    }}
  >
    <Spin size="large" />
  </div>
);

/**
 * Inner App component that uses the theme context
 * Must be rendered inside ThemeProvider
 */
function AppWithTheme() {
  const { themeConfig } = useTheme();

  const renderEmpty = () => <CustomEmpty />;

  return (
    <ConfigProvider theme={themeConfig} renderEmpty={renderEmpty}>
      <AntdApp>
        <Refine
          routerProvider={routerProvider}
          authProvider={authProvider}
          dataProvider={dataProvider}
          accessControlProvider={accessControlProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: "dashboard",
              list: "/",
              meta: { label: "Dashboard", icon: <DashboardOutlined /> }
            },
            {
              name: "organizations",
              list: "/organizations",
              create: "/organizations/create",
              edit: "/organizations/edit/:id",
              meta: { label: "Organizations", icon: <BankOutlined /> }
            },
            {
              name: "vessels",
              list: "/vessels",
              create: "/vessels/create",
              edit: "/vessels/edit/:id",
              show: "/vessels/show/:id",
              meta: { label: "Vessels", icon: <RocketOutlined /> }
            },
            {
              name: "inspections",
              list: "/inspections",
              create: "/inspections/create",
              edit: "/inspections/edit/:id",
              show: "/inspections/show/:id",
              meta: { label: "Inspections", icon: <FileTextOutlined /> }
            },
            {
              name: "users",
              list: "/users",
              create: "/users/create",
              edit: "/users/edit/:id",
              show: "/users/show/:id",
              meta: { label: "Users", icon: <UserOutlined /> }
            },
            {
              name: "settings",
              list: "/settings",
              meta: { label: "Settings", icon: <SettingOutlined /> }
            },
            {
              name: "audit-logs",
              list: "/audit-logs",
              meta: { label: "Audit Logs", icon: <AuditOutlined /> }
            }
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            projectId: "ship-reporting"
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <Authenticated
                    key="authenticated"
                    fallback={<Navigate to="/login" />}
                  >
                    <ThemedLayout
                      Title={() => (
                        <span className={styles.layoutTitle}>
                          Ship Reporting
                        </span>
                      )}
                      Header={() => <Header />}
                    >
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                {/* Organization routes (Super Admin only) */}
                <Route path="/organizations" element={<OrganizationList />} />
                <Route
                  path="/organizations/create"
                  element={<OrganizationForm />}
                />
                <Route
                  path="/organizations/edit/:id"
                  element={<OrganizationForm />}
                />
                {/* Vessel routes */}
                <Route path="/vessels" element={<VesselSettings />} />
                <Route path="/vessels/create" element={<VesselForm />} />
                <Route path="/vessels/edit/:id" element={<VesselForm />} />
                {/* Inspection routes */}
                <Route path="/inspections" element={<InspectionList />} />
                <Route
                  path="/inspections/create"
                  element={<InspectionForm />}
                />
                <Route
                  path="/inspections/edit/:id"
                  element={<InspectionForm />}
                />
                <Route
                  path="/inspections/show/:id"
                  element={<InspectionView />}
                />
                {/* User routes */}
                <Route path="/users" element={<UserList />} />
                <Route path="/users/create" element={<UserForm />} />
                <Route path="/users/edit/:id" element={<UserForm />} />
                {/* Settings routes */}
                <Route path="/settings" element={<OrganizationSettings />} />
                <Route
                  path="/settings/organization"
                  element={<OrganizationSettings />}
                />
                <Route path="/settings/vessels" element={<VesselSettings />} />
                <Route path="/settings/profile" element={<UserProfile />} />
                {/* Audit Logs routes (Admin/Super Admin) */}
                <Route path="/audit-logs" element={<AuditLogList />} />
              </Route>
            </Routes>
          </Suspense>
          <UnsavedChangesNotifier />
          <DocumentTitleHandler />
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
}

/**
 * Root App component
 * Wraps the app with necessary providers
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
