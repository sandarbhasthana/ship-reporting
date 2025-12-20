import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayout, useNotificationProvider } from "@refinedev/antd";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import {
  DashboardOutlined,
  RocketOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  BankOutlined
} from "@ant-design/icons";

import { authProvider, dataProvider, accessControlProvider } from "./providers";
import {
  LoginPage,
  DashboardPage,
  OrganizationSettings,
  VesselSettings,
  VesselForm,
  UserProfile,
  InspectionList,
  InspectionForm,
  InspectionView,
  UserList,
  UserForm,
  OrganizationList,
  OrganizationForm
} from "./pages";
import { ThemeProvider, useTheme } from "./theme";
import { Header, CustomEmpty } from "./components";
import styles from "./App.module.css";

import "@refinedev/antd/dist/reset.css";
import "./theme/variables.css";
import "./theme/global.css";

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
            }
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            projectId: "ship-reporting"
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              element={
                <Authenticated
                  key="authenticated"
                  fallback={<Navigate to="/login" />}
                >
                  <ThemedLayout
                    Title={() => (
                      <span className={styles.layoutTitle}>Ship Reporting</span>
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
              <Route path="/inspections/create" element={<InspectionForm />} />
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
            </Route>
          </Routes>
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
