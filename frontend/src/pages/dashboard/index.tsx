import { useEffect, useState, useCallback } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Typography } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl, useGo } from "@refinedev/core";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
  assignedVesselId?: string;
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

export const DashboardPage = () => {
  const apiUrl = useApiUrl();
  const go = useGo();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";

  const [captains, setCaptains] = useState<CaptainActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
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
