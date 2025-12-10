import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Typography } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl, useGo } from "@refinedev/core";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
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

export const DashboardPage = () => {
  const apiUrl = useApiUrl();
  const go = useGo();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";

  const [captains, setCaptains] = useState<CaptainActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch captain activity for admin
  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    const fetchCaptainActivity = async () => {
      try {
        console.log(
          "Fetching captain activity from:",
          `${apiUrl}/users/captain-activity`
        );
        const response = await fetch(`${apiUrl}/users/captain-activity`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        });
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Captain activity data:", data);

        if (cancelled) return;

        if (Array.isArray(data)) {
          setCaptains(data);
        } else {
          console.log("Data is not an array, setting empty");
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
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "Active" : "Offline"}
        </Tag>
      )
    },
    {
      title: "Last Activity",
      key: "lastActivity",
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
      render: (_: unknown, record: CaptainActivity) => {
        if (!record.lastActivity) {
          return "-";
        }
        return new Date(record.lastActivity.dateTime).toLocaleString();
      }
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
              value={0}
              prefix={<FileTextOutlined className={styles.iconPrimary} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardSecondary} hoverable>
            <Statistic
              title="Completed"
              value={0}
              prefix={<CheckCircleOutlined className={styles.iconSecondary} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardCoral} hoverable>
            <Statistic
              title="Pending"
              value={0}
              prefix={<ClockCircleOutlined className={styles.iconCoral} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.cardBlue} hoverable>
            <Statistic
              title="Active Vessels"
              value={0}
              prefix={<TeamOutlined className={styles.iconBlue} />}
            />
          </Card>
        </Col>
      </Row>

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
