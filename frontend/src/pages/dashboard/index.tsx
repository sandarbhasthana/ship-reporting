import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Typography } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  BankOutlined,
  RocketOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl, useGo } from "@refinedev/core";
import { LazyLineChart } from "../../components";
import { useTheme } from "../../theme";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
  assignedVesselId?: string;
  organizationName?: string;
}

interface CaptainActivity {
  id: string;
  name: string;
  vessel: string | null;
  isActive: boolean;
  lastActivity: {
    action: string;
    entityType: string;
    reportTitle: string | null;
    reportId: string | null;
    dateTime: string;
  } | null;
}

interface DashboardStats {
  totalInspections: number;
  completed: number;
  pending: number;
  activeVessels: number;
  openDeficiencies: number;
}

interface RecentDocument {
  id: string;
  title: string;
  vesselName: string;
  updatedAt: string;
  status: string;
  openCount: number;
  totalCount: number;
}

interface AnalyticsData {
  summary: {
    totalOrganizations: number;
    totalUsers: number;
    totalVessels: number;
    totalInspections: number;
  };
  userDistribution: { name: string; value: number }[];
  vesselDistribution: { name: string; value: number }[];
  inspectionDistribution: { name: string; value: number }[];
  organizationGrowth: { month: string; count: number }[];
  topOrganizations: {
    name: string;
    users: number;
    vessels: number;
    inspections: number;
  }[];
}

export const DashboardPage = () => {
  const apiUrl = useApiUrl();
  const go = useGo();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";
  const isSuperAdmin = identity?.role === "SUPER_ADMIN";

  const [captains, setCaptains] = useState<CaptainActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInspections: 0,
    completed: 0,
    pending: 0,
    activeVessels: 0,
    openDeficiencies: 0
  });

  // Fetch dashboard stats (inspections and vessels)
  const fetchDashboardStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch inspections
      setDocumentsLoading(true);
      const inspectionsRes = await fetch(`${apiUrl}/inspections`, { headers });
      const inspections = await inspectionsRes.json();

      if (Array.isArray(inspections)) {
        // Count entries by status across all inspections
        let openDeficiencies = 0;
        let completedEntries = 0;
        let pendingEntries = 0;

        // Build recent documents list for captains
        const recentDocs: RecentDocument[] = inspections
          .map(
            (inspection: {
              id: string;
              title: string;
              vessel?: { name: string };
              updatedAt: string;
              entries?: { status: string }[];
            }) => {
              let openCount = 0;
              const totalCount = inspection.entries?.length || 0;

              if (inspection.entries) {
                inspection.entries.forEach((entry: { status: string }) => {
                  if (entry.status === "CLOSED_SATISFACTORILY") {
                    completedEntries++;
                  } else {
                    pendingEntries++;
                    if (
                      entry.status === "OPEN" ||
                      entry.status === "FURTHER_ACTION_NEEDED"
                    ) {
                      openDeficiencies++;
                      openCount++;
                    }
                  }
                });
              }

              // Determine overall status
              let status = "Complete";
              if (openCount > 0) {
                status = "In Progress";
              } else if (totalCount === 0) {
                status = "New";
              }

              return {
                id: inspection.id,
                title: inspection.title,
                vesselName: inspection.vessel?.name || "Unknown",
                updatedAt: inspection.updatedAt,
                status,
                openCount,
                totalCount
              };
            }
          )
          .sort(
            (a: RecentDocument, b: RecentDocument) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, 10); // Show only 10 most recent

        setRecentDocuments(recentDocs);

        // For admin, fetch vessels count
        let activeVessels = 0;
        if (isAdmin) {
          const vesselsRes = await fetch(`${apiUrl}/vessels`, { headers });
          const vessels = await vesselsRes.json();
          if (Array.isArray(vessels)) {
            activeVessels = vessels.length;
          }
        }

        setStats({
          totalInspections: inspections.length,
          completed: completedEntries,
          pending: pendingEntries,
          activeVessels,
          openDeficiencies
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [apiUrl, isAdmin]);

  // Fetch stats on mount and when identity changes
  useEffect(() => {
    if (identity) {
      fetchDashboardStats();
    }
  }, [identity, fetchDashboardStats]);

  // Fetch captain activity for admin
  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    const fetchCaptainActivity = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/captain-activity`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        });
        const data = await response.json();

        if (cancelled) return;

        if (Array.isArray(data)) {
          setCaptains(data);
        } else {
          setCaptains([]);
        }
      } catch (error) {
        console.error("Error fetching captain activity:", error);
        if (cancelled) return;
        setCaptains([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchCaptainActivity();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, apiUrl]);

  // Fetch platform analytics for SUPER_ADMIN
  useEffect(() => {
    if (!isSuperAdmin) return;

    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const response = await fetch(`${apiUrl}/organization/analytics`, {
          headers
        });
        const data = await response.json();

        if (cancelled) return;

        if (data && data.summary) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, apiUrl]);

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      CREATE: "Created",
      UPDATE: "Edited",
      DELETE: "Deleted",
      STATUS_CHANGE: "Changed status of"
    };
    return actionMap[action] || action;
  };

  const captainColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: CaptainActivity, b: CaptainActivity) =>
        (a.name || "").localeCompare(b.name || ""),
      render: (name: string, record: CaptainActivity) => (
        <div>
          <Text strong>{name}</Text>
          {record.vessel && (
            <Text type="secondary" className={styles.vesselText}>
              {record.vessel}
            </Text>
          )}
        </div>
      )
    },
    {
      title: "Vessel",
      dataIndex: "vessel",
      key: "vessel",
      sorter: (a: CaptainActivity, b: CaptainActivity) =>
        (a.vessel || "").localeCompare(b.vessel || ""),
      render: (vessel: string | null) => vessel || "-"
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      sorter: (a: CaptainActivity, b: CaptainActivity) =>
        Number(b.isActive) - Number(a.isActive),
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "Active" : "Offline"}
        </Tag>
      )
    },
    {
      title: "Last Activity",
      key: "lastActivity",
      sorter: (a: CaptainActivity, b: CaptainActivity) => {
        const aAction = a.lastActivity?.action || "";
        const bAction = b.lastActivity?.action || "";
        return aAction.localeCompare(bAction);
      },
      render: (_: unknown, record: CaptainActivity) => {
        if (!record.lastActivity) {
          return <Text type="secondary">No activity yet</Text>;
        }
        const { action, reportTitle, reportId } = record.lastActivity;
        return (
          <span>
            {formatAction(action)}{" "}
            {reportTitle && reportId ? (
              <a
                onClick={() =>
                  go({
                    to: `/inspections/show/${reportId}`,
                    type: "push"
                  })
                }
                className={styles.reportLink}
              >
                {reportTitle}
              </a>
            ) : (
              <Text type="secondary">Unknown document</Text>
            )}
          </span>
        );
      }
    },
    {
      title: "Date/Time",
      key: "dateTime",
      sorter: (a: CaptainActivity, b: CaptainActivity) => {
        const aTime = a.lastActivity?.dateTime
          ? new Date(a.lastActivity.dateTime).getTime()
          : 0;
        const bTime = b.lastActivity?.dateTime
          ? new Date(b.lastActivity.dateTime).getTime()
          : 0;
        return aTime - bTime;
      },
      render: (_: unknown, record: CaptainActivity) => {
        if (!record.lastActivity) {
          return "-";
        }
        return new Date(record.lastActivity.dateTime).toLocaleString();
      }
    }
  ];

  // Recent documents columns for captains
  const recentDocColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string) => <Text strong>{title}</Text>
    },
    {
      title: "Vessel",
      dataIndex: "vesselName",
      key: "vesselName"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          "In Progress": "orange",
          Complete: "green",
          New: "blue"
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      }
    },
    {
      title: "Open Items",
      key: "openItems",
      render: (_: unknown, record: RecentDocument) => (
        <span>
          {record.openCount} / {record.totalCount}
        </span>
      )
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  // Generate distinct colors for n items using HSL color space
  const generateColors = useCallback((count: number) => {
    const colors: string[] = [];
    const saturation = 70;
    const lightness = 55;
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  }, []);

  // Theme-aware chart configuration
  const { isDark } = useTheme();
  const chartTheme = useMemo(
    () => ({
      theme: isDark ? "classicDark" : "classic",
      textColor: isDark ? "#e0e0e0" : "#333333",
      labelColor: isDark ? "#b0b0b0" : "#555555"
    }),
    [isDark]
  );

  // SUPER_ADMIN Dashboard with Analytics
  if (isSuperAdmin) {
    return (
      <div className={styles.pageContainer}>
        <Title level={2}>Platform Administration</Title>
        <Text type="secondary">
          Welcome back, {identity?.name || identity?.email}
        </Text>

        {/* Platform Statistics */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.cardPrimary} hoverable>
              <Statistic
                title="Organizations"
                value={analytics?.summary.totalOrganizations || 0}
                prefix={<BankOutlined className={styles.iconPrimary} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.cardSecondary} hoverable>
              <Statistic
                title="Total Users"
                value={analytics?.summary.totalUsers || 0}
                prefix={<UserOutlined className={styles.iconSecondary} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.cardBlue} hoverable>
              <Statistic
                title="Total Vessels"
                value={analytics?.summary.totalVessels || 0}
                prefix={<RocketOutlined className={styles.iconBlue} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className={styles.cardInspection} hoverable>
              <Statistic
                title="Total Inspections"
                value={analytics?.summary.totalInspections || 0}
                prefix={<FileTextOutlined className={styles.iconInspection} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1: Growth & Top Organizations */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="Organization Growth"
              className={styles.chartCard}
              loading={loading}
            >
              <div className={styles.chartContainer}>
                {analytics?.organizationGrowth &&
                analytics.organizationGrowth.length > 0 ? (
                  <LazyLineChart
                    data={analytics.organizationGrowth}
                    xField="month"
                    yField="count"
                    smooth
                    theme={chartTheme.theme}
                    color="#a05aff"
                    point={{
                      size: 6,
                      shape: "circle",
                      style: { fill: "#a05aff", stroke: "#fff", lineWidth: 2 }
                    }}
                    lineStyle={{ lineWidth: 3 }}
                    axis={{
                      y: {
                        title: "Total Organizations",
                        labelFill: chartTheme.labelColor,
                        titleFill: chartTheme.textColor,
                        grid: true,
                        gridStroke: isDark ? "#444" : "#d9d9d9",
                        gridLineDash: [4, 4]
                      },
                      x: {
                        title: "Month",
                        labelFill: chartTheme.labelColor,
                        titleFill: chartTheme.textColor,
                        grid: true,
                        gridStroke: isDark ? "#444" : "#d9d9d9",
                        gridLineDash: [4, 4]
                      }
                    }}
                  />
                ) : (
                  <div className={styles.chartEmpty}>
                    No growth data available yet
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="Top Organizations by Activity"
              className={styles.chartCard}
              loading={loading}
            >
              <div className={styles.chartContainer}>
                {analytics?.topOrganizations &&
                analytics.topOrganizations.length > 0 ? (
                  <LazyLineChart
                    data={analytics.topOrganizations}
                    xField="name"
                    yField="inspections"
                    smooth
                    theme={chartTheme.theme}
                    color="#1bcfb4"
                    point={{
                      size: 6,
                      shape: "circle",
                      style: { fill: "#1bcfb4", stroke: "#fff", lineWidth: 2 }
                    }}
                    lineStyle={{ lineWidth: 3 }}
                    axis={{
                      y: {
                        title: "Inspections",
                        labelFill: chartTheme.labelColor,
                        titleFill: chartTheme.textColor,
                        grid: true,
                        gridStroke: isDark ? "#444" : "#d9d9d9",
                        gridLineDash: [4, 4]
                      },
                      x: {
                        title: "Organization",
                        labelFill: chartTheme.labelColor,
                        titleFill: chartTheme.textColor,
                        grid: true,
                        gridStroke: isDark ? "#444" : "#d9d9d9",
                        gridLineDash: [4, 4]
                      }
                    }}
                  />
                ) : (
                  <div className={styles.chartEmpty}>
                    No inspection data available yet
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Row 2: Users & Vessels Distribution Tables */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="Users by Organization"
              className={styles.chartCard}
              loading={loading}
            >
              <div className={styles.tableContainer}>
                {analytics?.userDistribution &&
                analytics.userDistribution.length > 0 ? (
                  <Table
                    dataSource={analytics.userDistribution.map((item, idx) => ({
                      ...item,
                      key: item.name,
                      color: generateColors(analytics.userDistribution.length)[
                        idx
                      ]
                    }))}
                    columns={[
                      {
                        title: "Organization",
                        dataIndex: "name",
                        key: "name",
                        render: (
                          name: string,
                          record: { color: string; name: string }
                        ) => (
                          <span>
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: record.color }}
                            />
                            {name}
                          </span>
                        )
                      },
                      {
                        title: "Users",
                        dataIndex: "value",
                        key: "value",
                        width: 100,
                        align: "center" as const,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sorter: (a: any, b: any) => b.value - a.value,
                        defaultSortOrder: "ascend" as const
                      }
                    ]}
                    pagination={{ pageSize: 5, size: "small" }}
                    size="small"
                  />
                ) : (
                  <div className={styles.chartEmpty}>
                    No user data available yet
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="Vessels by Organization"
              className={styles.chartCard}
              loading={loading}
            >
              <div className={styles.tableContainer}>
                {analytics?.vesselDistribution &&
                analytics.vesselDistribution.length > 0 ? (
                  <Table
                    dataSource={analytics.vesselDistribution.map(
                      (item, idx) => ({
                        ...item,
                        key: item.name,
                        color: generateColors(
                          analytics.vesselDistribution.length
                        )[idx]
                      })
                    )}
                    columns={[
                      {
                        title: "Organization",
                        dataIndex: "name",
                        key: "name",
                        render: (
                          name: string,
                          record: { color: string; name: string }
                        ) => (
                          <span>
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: record.color }}
                            />
                            {name}
                          </span>
                        )
                      },
                      {
                        title: "Vessels",
                        dataIndex: "value",
                        key: "value",
                        width: 100,
                        align: "center" as const,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sorter: (a: any, b: any) => b.value - a.value,
                        defaultSortOrder: "ascend" as const
                      }
                    ]}
                    pagination={{ pageSize: 5, size: "small" }}
                    size="small"
                  />
                ) : (
                  <div className={styles.chartEmpty}>
                    No vessel data available yet
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Title level={2}>
        Welcome{" "}
        <Text className={styles.userName}>
          {identity?.name || identity?.email}!
        </Text>
      </Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardPrimary} hoverable>
            <Statistic
              title="Total Inspections"
              value={stats.totalInspections}
              prefix={<FileTextOutlined className={styles.iconPrimary} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardSecondary} hoverable>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined className={styles.iconSecondary} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardCoral} hoverable>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined className={styles.iconCoral} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {isAdmin ? (
            <Card className={styles.cardBlue} hoverable>
              <Statistic
                title="Active Vessels"
                value={stats.activeVessels}
                prefix={<TeamOutlined className={styles.iconBlue} />}
              />
            </Card>
          ) : (
            <Card className={styles.cardWarning} hoverable>
              <Statistic
                title="Open Deficiencies"
                value={stats.openDeficiencies}
                prefix={<WarningOutlined className={styles.iconWarning} />}
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* Captain Only: Recent Documents Table */}
      {!isAdmin && (
        <Card title="Recent Documents" className={styles.usersCard}>
          <Table
            dataSource={recentDocuments}
            columns={recentDocColumns}
            rowKey="id"
            loading={documentsLoading}
            pagination={{ pageSize: 5 }}
            size="middle"
            onRow={(record) => ({
              onClick: () =>
                go({
                  to: `/inspections/edit/${record.id}`,
                  type: "push"
                }),
              style: { cursor: "pointer" }
            })}
          />
        </Card>
      )}

      {/* Admin Only: Captain Activity Table */}
      {isAdmin && (
        <Card title="Captain Activity" className={styles.usersCard}>
          <Table
            dataSource={captains}
            columns={captainColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};
