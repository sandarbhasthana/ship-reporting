import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Typography,
  Spin,
  Table,
  Select,
  DatePicker,
  App,
  Statistic,
  Row,
  Col
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  ExpandOutlined,
  RightOutlined,
  DownOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useNavigate, Link } from "react-router";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import styles from "./audit-logs.module.css";

const { Title, Text } = Typography;

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
  organization: { id: string; name: string } | null;
}

interface AuditStats {
  total: number;
  recentActivity: number;
  byAction: Array<{ action: string; count: number }>;
  byEntityType: Array<{ entityType: string; count: number }>;
}

interface UserIdentity {
  id: string;
  role: string;
}

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGIN_FAILED", label: "Login Failed" },
  { value: "PASSWORD_CHANGE", label: "Password Change" },
  { value: "OFFICE_SIGN", label: "Office Sign" },
  { value: "OFFICE_UNSIGN", label: "Office Unsign" },
  { value: "STATUS_CHANGE", label: "Status Change" },
  { value: "ASSIGN", label: "Assign" },
  { value: "UNASSIGN", label: "Unassign" },
  { value: "ROLE_CHANGE", label: "Role Change" }
];

const ENTITY_OPTIONS = [
  { value: "User", label: "User" },
  { value: "Vessel", label: "Vessel" },
  { value: "Organization", label: "Organization" },
  { value: "InspectionReport", label: "Inspection Report" },
  { value: "InspectionEntry", label: "Inspection Entry" },
  { value: "Auth", label: "Authentication" }
];

export const AuditLogList = () => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin =
    identity?.role === "ADMIN" || identity?.role === "SUPER_ADMIN";
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [entityType, setEntityType] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("skip", String((page - 1) * pageSize));
      params.append("take", String(pageSize));
      if (entityType) params.append("entityType", entityType);
      if (action) params.append("action", action);
      if (startDate)
        params.append("startDate", startDate.startOf("day").toISOString());
      if (endDate) params.append("endDate", endDate.endOf("day").toISOString());

      const response = await fetch(`${apiUrl}/audit-logs?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
        setTotal(data.total || 0);
      } else if (response.status === 401) {
        message.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        message.error("Failed to load audit logs");
      }
    } catch (error) {
      message.error(`Failed to load audit logs: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [
    apiUrl,
    page,
    pageSize,
    entityType,
    action,
    startDate,
    endDate,
    getAuthHeaders,
    message,
    navigate
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/audit-logs/stats`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      // Stats are optional, don't show error
    }
  }, [apiUrl, getAuthHeaders]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
      fetchStats();
    }
  }, [isAdmin, fetchLogs, fetchStats]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append("entityType", entityType);
      if (action) params.append("action", action);
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const response = await fetch(`${apiUrl}/audit-logs/export?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${dayjs().format("YYYY-MM-DD")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success("Audit logs exported successfully");
      } else {
        message.error("Failed to export audit logs");
      }
    } catch (error) {
      message.error(`Export failed: ${error}`);
    }
  };

  const getActionBadgeClass = (actionType: string): string => {
    const actionMap: Record<string, string> = {
      CREATE: styles.badgeCreate,
      UPDATE: styles.badgeUpdate,
      DELETE: styles.badgeDelete,
      HARD_DELETE: styles.badgeDelete,
      LOGIN: styles.badgeLogin,
      LOGIN_FAILED: styles.badgeLoginFailed,
      PASSWORD_CHANGE: styles.badgeLogin,
      PASSWORD_CHANGE_FAILED: styles.badgeLoginFailed,
      OFFICE_SIGN: styles.badgeSign,
      OFFICE_UNSIGN: styles.badgeSign,
      STATUS_CHANGE: styles.badgeUpdate,
      ASSIGN: styles.badgeAssign,
      UNASSIGN: styles.badgeAssign,
      ROLE_CHANGE: styles.badgeAssign
    };
    return actionMap[actionType] || styles.badgeDefault;
  };

  const formatAction = (actionType: string): string => {
    return actionType.replace(/_/g, " ");
  };

  // Extract entity name from before/after data
  const getEntityDisplayName = (record: AuditLog): string => {
    const data = record.after || record.before;
    if (!data) return record.entityId.substring(0, 8) + "...";

    // For InspectionReport, show ReportType (inspectedBy) + VesselName
    if (record.entityType === "InspectionReport") {
      const vessel = data.vessel as Record<string, unknown> | undefined;
      const vesselName = typeof vessel?.name === "string" ? vessel.name : null;
      const reportType =
        typeof data.inspectedBy === "string" ? data.inspectedBy : null;

      if (reportType && vesselName) {
        const name = `${reportType} - ${vesselName}`;
        return name.length > 20 ? name.substring(0, 20) + "..." : name;
      } else if (reportType) {
        return reportType.length > 20
          ? reportType.substring(0, 20) + "..."
          : reportType;
      } else if (vesselName) {
        return vesselName.length > 20
          ? vesselName.substring(0, 20) + "..."
          : vesselName;
      }
      return record.entityId.substring(0, 8) + "...";
    }

    // Try common name fields
    if (typeof data.name === "string") return data.name;
    if (typeof data.email === "string") return data.email;
    if (typeof data.title === "string") return data.title;
    if (typeof data.imoNumber === "string") return `IMO: ${data.imoNumber}`;

    // For vessels, try vessel name
    if (record.entityType === "Vessel" && typeof data.name === "string") {
      return data.name;
    }

    // For users, try name or email
    if (record.entityType === "User") {
      if (typeof data.name === "string") return data.name;
      if (typeof data.email === "string") return data.email;
    }

    // Fallback to truncated ID
    return record.entityId.substring(0, 8) + "...";
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => dayjs(date).format("MMM DD, YYYY HH:mm:ss")
    },
    {
      title: "User",
      key: "user",
      width: 180,
      render: (_: unknown, record: AuditLog) =>
        record.user?.name || record.user?.email || "System"
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 140,
      render: (actionType: string) => (
        <span className={`${styles.badge} ${getActionBadgeClass(actionType)}`}>
          {formatAction(actionType)}
        </span>
      )
    },
    {
      title: "Entity Type",
      dataIndex: "entityType",
      key: "entityType",
      width: 150,
      render: (type: string) => (
        <span className={styles.entityBadge}>{type}</span>
      )
    },
    {
      title: "Entity",
      key: "entity",
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: AuditLog) => {
        const displayName = getEntityDisplayName(record);

        // For InspectionReport, show as a clickable link
        if (record.entityType === "InspectionReport") {
          return (
            <Link
              to={`/inspections/show/${record.entityId}`}
              state={{ from: "audit-logs" }}
              style={{ fontSize: 12 }}
              title={`View: ${displayName}\nID: ${record.entityId}`}
            >
              {displayName}
            </Link>
          );
        }

        return (
          <Text
            copyable={{ text: record.entityId }}
            style={{ fontSize: 12 }}
            title={`ID: ${record.entityId}`}
          >
            {displayName}
          </Text>
        );
      }
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      width: 130,
      align: "center" as const,
      render: (ip: string | null) => (
        <Text type={ip ? undefined : "secondary"} style={{ fontSize: 12 }}>
          {ip || "N/A"}
        </Text>
      )
    }
  ];

  // Check if value is collapsible (array or large object)
  const isCollapsible = (value: unknown): boolean => {
    if (Array.isArray(value) && value.length > 0) return true;
    if (value && typeof value === "object") {
      const keys = Object.keys(value);
      return keys.length > 3;
    }
    return false;
  };

  // Get summary text for collapsible values
  const getSummaryText = (value: unknown): string => {
    if (Array.isArray(value)) {
      return `[${value.length} item${value.length !== 1 ? "s" : ""}]`;
    }
    if (value && typeof value === "object") {
      const keys = Object.keys(value);
      return `{${keys.length} field${keys.length !== 1 ? "s" : ""}}`;
    }
    return "";
  };

  // Format simple values
  const formatSimpleValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string" && value.length > 100) {
      return `"${value.substring(0, 100)}..."`;
    }
    return JSON.stringify(value);
  };

  // Get all paths that differ between two values
  const getDiffPaths = (
    val1: unknown,
    val2: unknown,
    path: string = ""
  ): Set<string> => {
    const paths = new Set<string>();

    if (val1 === val2) return paths;
    if (JSON.stringify(val1) === JSON.stringify(val2)) return paths;

    // If types differ or primitives differ, this path is different
    if (
      typeof val1 !== typeof val2 ||
      val1 === null ||
      val2 === null ||
      typeof val1 !== "object"
    ) {
      if (path) paths.add(path);
      return paths;
    }

    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const maxLen = Math.max(val1.length, val2.length);
      for (let i = 0; i < maxLen; i++) {
        const subPaths = getDiffPaths(val1[i], val2[i], `${path}[${i}]`);
        subPaths.forEach((p) => paths.add(p));
      }
      return paths;
    }

    // Handle objects
    const obj1 = val1 as Record<string, unknown>;
    const obj2 = val2 as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach((key) => {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in obj1) || !(key in obj2)) {
        paths.add(newPath);
      } else {
        const subPaths = getDiffPaths(obj1[key], obj2[key], newPath);
        subPaths.forEach((p) => paths.add(p));
      }
    });

    return paths;
  };

  // Render JSON with diff highlighting
  const renderHighlightedJson = (
    value: unknown,
    compareWith: unknown,
    variant: "before" | "after"
  ) => {
    const diffPaths = getDiffPaths(value, compareWith);
    const lines = JSON.stringify(value, null, 2).split("\n");

    // Build a map of which lines contain changed paths
    const changedLineIndices = new Set<number>();

    // Parse JSON to find line numbers for changed paths
    let currentPath: string[] = [];
    let arrayIndices: number[] = [];
    let inArray = false;

    lines.forEach((line, lineIdx) => {
      // Detect array start/end
      if (line.includes("[")) {
        inArray = true;
        arrayIndices.push(-1);
      }
      if (line.includes("]")) {
        inArray = false;
        arrayIndices.pop();
      }

      // Detect object in array
      if (inArray && line.trim() === "{") {
        arrayIndices[arrayIndices.length - 1]++;
      }

      // Check for key
      const keyMatch = line.match(/^\s*"([^"]+)":/);
      if (keyMatch) {
        const key = keyMatch[1];

        // Build current path
        let pathStr = currentPath.join(".");
        if (
          arrayIndices.length > 0 &&
          arrayIndices[arrayIndices.length - 1] >= 0
        ) {
          pathStr += `[${arrayIndices[arrayIndices.length - 1]}].${key}`;
        } else {
          pathStr = pathStr ? `${pathStr}.${key}` : key;
        }

        // Check if this path or any parent path is in diffPaths
        const isChanged = Array.from(diffPaths).some(
          (dp) =>
            dp === pathStr ||
            dp.startsWith(pathStr + ".") ||
            dp.startsWith(pathStr + "[")
        );

        if (isChanged) {
          changedLineIndices.add(lineIdx);
        }
      }
    });

    return lines.map((line, index) => {
      const isChanged = changedLineIndices.has(index);
      if (isChanged) {
        return (
          <span
            key={index}
            className={
              variant === "before"
                ? styles.diffLineRemoved
                : styles.diffLineAdded
            }
          >
            {line}
            {"\n"}
          </span>
        );
      }
      return line + "\n";
    });
  };

  // Collapsible Value Component
  const CollapsibleValue = ({
    value,
    compareWith,
    variant,
    defaultExpanded = false
  }: {
    value: unknown;
    compareWith?: unknown;
    variant?: "before" | "after";
    defaultExpanded?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!isCollapsible(value)) {
      return <code>{formatSimpleValue(value)}</code>;
    }

    return (
      <div className={styles.collapsibleValue}>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <DownOutlined /> : <RightOutlined />}
          <span className={styles.collapseSummary}>
            {getSummaryText(value)}
          </span>
        </button>
        {expanded && (
          <pre className={styles.expandedJson}>
            {compareWith !== undefined && variant
              ? renderHighlightedJson(value, compareWith, variant)
              : JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Get changed fields between before and after (top-level only)
  const getChangedFields = (
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null
  ): {
    key: string;
    beforeValue: unknown;
    afterValue: unknown;
    changeType: "added" | "removed" | "modified";
  }[] => {
    const changes: {
      key: string;
      beforeValue: unknown;
      afterValue: unknown;
      changeType: "added" | "removed" | "modified";
    }[] = [];

    if (!before && !after) return changes;

    const beforeKeys = before ? Object.keys(before) : [];
    const afterKeys = after ? Object.keys(after) : [];
    const allKeys = new Set([...beforeKeys, ...afterKeys]);

    allKeys.forEach((key) => {
      const beforeVal = before?.[key];
      const afterVal = after?.[key];
      const beforeStr = JSON.stringify(beforeVal);
      const afterStr = JSON.stringify(afterVal);

      if (beforeStr !== afterStr) {
        let changeType: "added" | "removed" | "modified" = "modified";
        if (beforeVal === undefined) changeType = "added";
        else if (afterVal === undefined) changeType = "removed";

        changes.push({
          key,
          beforeValue: beforeVal,
          afterValue: afterVal,
          changeType
        });
      }
    });

    return changes;
  };

  const expandedRowRender = (record: AuditLog) => {
    const before = record.before as Record<string, unknown> | null;
    const after = record.after as Record<string, unknown> | null;
    const changes = getChangedFields(before, after);

    // For CREATE/DELETE actions, show full data
    if (!before || !after) {
      const data = before || after;
      return (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsTitle}>
            {!before ? "Created Record" : "Deleted Record"}
          </div>
          <div className={styles.diffBox}>
            <pre className={styles.jsonContent}>
              {data ? JSON.stringify(data, null, 2) : "N/A"}
            </pre>
          </div>
          {record.userAgent && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                User Agent: {record.userAgent}
              </Text>
            </div>
          )}
        </div>
      );
    }

    // For UPDATE actions, show only changed fields
    return (
      <div className={styles.detailsPanel}>
        <div className={styles.detailsTitle}>
          Changed Fields ({changes.length})
        </div>
        {changes.length === 0 ? (
          <Text type="secondary">No changes detected</Text>
        ) : (
          <div className={styles.changesTable}>
            <div className={styles.changesHeader}>
              <div className={styles.changesHeaderCell}>Field</div>
              <div className={styles.changesHeaderCell}>Before</div>
              <div className={styles.changesHeaderCell}>After</div>
            </div>
            {changes.map(({ key, beforeValue, afterValue, changeType }) => (
              <div key={key} className={styles.changesRow}>
                <div className={styles.changesCell}>
                  <span className={styles.fieldName}>{key}</span>
                  {changeType === "added" && (
                    <span className={styles.changeTagAdded}>NEW</span>
                  )}
                  {changeType === "removed" && (
                    <span className={styles.changeTagRemoved}>REMOVED</span>
                  )}
                </div>
                <div
                  className={`${styles.changesCell} ${styles.changesCellBefore}`}
                >
                  <CollapsibleValue
                    value={beforeValue}
                    compareWith={afterValue}
                    variant="before"
                  />
                </div>
                <div
                  className={`${styles.changesCell} ${styles.changesCellAfter}`}
                >
                  <CollapsibleValue
                    value={afterValue}
                    compareWith={beforeValue}
                    variant="after"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {record.userAgent && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              User Agent: {record.userAgent}
            </Text>
          </div>
        )}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <Card>
        <Title level={4}>Access Denied</Title>
        <Text type="secondary">Only administrators can view audit logs.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.headerContainer}>
        <div>
          <Title level={4} className={styles.headerTitle}>
            Audit Logs
          </Title>
          <Text type="secondary">Track all system activities and changes</Text>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total Logs" value={stats.total} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Last 24h" value={stats.recentActivity} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <div className={styles.filterRow}>
        <Select
          placeholder="Entity Type"
          allowClear
          className={styles.filterItem}
          value={entityType}
          onChange={setEntityType}
          options={ENTITY_OPTIONS}
        />
        <Select
          placeholder="Action"
          allowClear
          className={styles.filterItem}
          value={action}
          onChange={setAction}
          options={ACTION_OPTIONS}
        />
        <DatePicker
          placeholder="Start Date"
          className={styles.filterItem}
          value={startDate}
          onChange={setStartDate}
        />
        <DatePicker
          placeholder="End Date"
          className={styles.filterItem}
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      {loading ? (
        <div className={styles.spinnerContainer}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: (expanded, record) => {
              setExpandedRowKeys(expanded ? [record.id] : []);
            },
            expandIcon: ({ expanded, onExpand, record }) => (
              <Button
                type="text"
                size="small"
                icon={<ExpandOutlined />}
                onClick={(e) => onExpand(record, e)}
                style={{
                  transform: expanded ? "rotate(45deg)" : "none",
                  transition: "transform 0.2s"
                }}
              />
            )
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} records`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
          scroll={{ x: 900 }}
        />
      )}
    </Card>
  );
};
