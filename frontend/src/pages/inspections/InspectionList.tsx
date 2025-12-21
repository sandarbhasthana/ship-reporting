import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  Input,
  Select,
  Typography,
  Dropdown,
  App
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  MoreOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { DeleteIcon } from "../../components";
import { Link, useNavigate } from "react-router";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import styles from "./inspections.module.css";

const { Title, Text } = Typography;

interface InspectionReport {
  id: string;
  title: string;
  vesselId: string;
  vessel?: { id: string; name: string };
  shipFileNo?: string;
  officeFileNo?: string;
  inspectedBy?: string;
  inspectionDate?: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  entries?: Array<{ id: string; status: string }>;
  _count?: { entries: number };
}

interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const InspectionList = () => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const [inspections, setInspections] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [vessels, setVessels] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [vesselFilter, setVesselFilter] = useState<string | undefined>();

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/inspections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInspections(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inspections:", error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchVessels = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/vessels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVessels(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch vessels:", error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchInspections();
    fetchVessels();
  }, [fetchInspections, fetchVessels]);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete Inspection",
      content:
        "Are you sure you want to delete this inspection? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/inspections/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            message.success("Inspection deleted successfully");
            fetchInspections();
          } else {
            message.error("Failed to delete inspection");
          }
        } catch {
          message.error("Failed to delete inspection");
        }
      }
    });
  };

  const getActionMenuItems = (record: InspectionReport): MenuProps["items"] => {
    return [
      {
        key: "view",
        label: "View",
        icon: <EyeOutlined />,
        onClick: () => navigate(`/inspections/show/${record.id}`)
      },
      {
        key: "edit",
        label: "Edit",
        icon: <EditOutlined />,
        onClick: () => navigate(`/inspections/edit/${record.id}`)
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteIcon />,
        danger: true,
        onClick: () => handleDelete(record.id)
      }
    ];
  };

  const getOverallStatus = (entries?: Array<{ status: string }>) => {
    if (!entries || entries.length === 0) return "OPEN";
    const hasOpen = entries.some((e) => e.status === "OPEN");
    const hasFurtherAction = entries.some(
      (e) => e.status === "FURTHER_ACTION_NEEDED"
    );
    if (hasOpen) return "OPEN";
    if (hasFurtherAction) return "FURTHER_ACTION_NEEDED";
    return "CLOSED_SATISFACTORILY";
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      OPEN: { color: "orange", text: "Open" },
      FURTHER_ACTION_NEEDED: { color: "red", text: "Further Action" },
      CLOSED_SATISFACTORILY: { color: "green", text: "Closed" }
    };
    const { color, text } = config[status] || {
      color: "default",
      text: status
    };
    return <Tag color={color}>{text}</Tag>;
  };

  // Filter logic continues in next part...
  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      !searchText ||
      inspection.vessel?.name
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      inspection.inspectedBy
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      inspection.shipFileNo?.toLowerCase().includes(searchText.toLowerCase());

    const matchesVessel = !vesselFilter || inspection.vesselId === vesselFilter;

    const overallStatus = getOverallStatus(inspection.entries);
    const matchesStatus = !statusFilter || overallStatus === statusFilter;

    return matchesSearch && matchesVessel && matchesStatus;
  });

  const columns: ColumnsType<InspectionReport> = [
    {
      title: "Vessel",
      dataIndex: ["vessel", "name"],
      key: "vessel",
      sorter: (a, b) =>
        (a.vessel?.name || "").localeCompare(b.vessel?.name || "")
    },
    {
      title: "Inspection Type",
      dataIndex: "inspectedBy",
      key: "inspectedBy"
    },
    {
      title: "Inspection Date",
      dataIndex: "inspectionDate",
      key: "inspectionDate",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        new Date(a.inspectionDate || 0).getTime() -
        new Date(b.inspectionDate || 0).getTime()
    },
    {
      title: "Ship File No",
      dataIndex: "shipFileNo",
      key: "shipFileNo"
    },
    {
      title: "Entries",
      key: "entries",
      render: (_: unknown, record: InspectionReport) =>
        record._count?.entries ?? record.entries?.length ?? 0
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: InspectionReport) =>
        getStatusTag(getOverallStatus(record.entries))
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center" as const,
      render: (_: unknown, record: InspectionReport) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  return (
    <Card>
      <div className={styles.headerContainer}>
        <div>
          <Title level={4} className={styles.headerTitle}>
            Inspection Reports
          </Title>
          <Text type="secondary">View and manage inspection reports</Text>
        </div>
        {/* Only Captains can create new inspection reports */}
        {!isAdmin && (
          <Link to="/inspections/create">
            <Button type="primary" icon={<PlusOutlined />}>
              New Inspection
            </Button>
          </Link>
        )}
      </div>

      <div className={styles.filtersContainer}>
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined />}
          className={styles.filterInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Filter by Vessel"
          className={styles.filterSelect}
          value={vesselFilter}
          onChange={setVesselFilter}
          allowClear
          options={vessels.map((v) => ({ label: v.name, value: v.id }))}
        />
        <Select
          placeholder="Filter by Status"
          className={styles.filterSelect}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          options={[
            { label: "Open", value: "OPEN" },
            { label: "Further Action", value: "FURTHER_ACTION_NEEDED" },
            { label: "Closed", value: "CLOSED_SATISFACTORILY" }
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredInspections}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </Card>
  );
};
