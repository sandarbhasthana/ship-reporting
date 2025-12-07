import { Refine, Authenticated } from "@refinedev/core";
import {
  ThemedLayout,
  useNotificationProvider,
  RefineThemes
} from "@refinedev/antd";
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
  SettingOutlined
} from "@ant-design/icons";

import { authProvider, dataProvider } from "./providers";
import {
  LoginPage,
  DashboardPage,
  OrganizationSettings,
  VesselSettings,
  UserProfile,
  InspectionList,
  InspectionForm,
  InspectionView
} from "./pages";

import "@refinedev/antd/dist/reset.css";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            authProvider={authProvider}
            dataProvider={dataProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Dashboard", icon: <DashboardOutlined /> }
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
                        <span className="font-[18px] font-weight-[600]">
                          Ship Reporting
                        </span>
                      )}
                    >
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                {/* Vessel routes */}
                <Route path="/vessels" element={<VesselSettings />} />
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
                {/* User routes - to be implemented */}
                <Route
                  path="/users"
                  element={<div>Users List (Coming Soon)</div>}
                />
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
    </BrowserRouter>
  );
}

export default App;
