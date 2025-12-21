import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Spin,
  Input,
  Dropdown,
  App,
  Tag,
  Space
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  MoreOutlined,
  BankOutlined,
  TeamOutlined,
  RocketOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { S3Image, DeleteIcon } from "../../components";
import styles from "./organizations.module.css";

const { Title, Text } = Typography;

interface OrganizationData {
  id: string;
  name: string;
  logo?: string;
  defaultFormNo?: string;
  footerText?: string;
  createdAt: string;
  _count: {
    vessels: number;
    users: number;
  };
}

interface UserIdentity {
  id: string;
  role: string;
}

export const OrganizationList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [searchText, setSearchText] = useState("");
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const isSuperAdmin = identity?.role === "SUPER_ADMIN";

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        message.error("No authentication token found. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${apiUrl}/organization`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(Array.isArray(data) ? data : data.data || []);
      } else if (response.status === 401) {
        message.error("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (response.status === 403) {
        message.error("You don't have permission to view organizations");
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || "Failed to load organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      message.error(`Failed to load organizations: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, message]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrganizations();
    } else {
      setLoading(false);
    }
  }, [fetchOrganizations, isSuperAdmin]);

  const handleDelete = (orgId: string, orgName: string) => {
    modal.confirm({
      title: "Delete Organization",
      content: `Are you sure you want to delete "${orgName}"? This will also delete all associated vessels, users, and inspection reports. This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/organization/${orgId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            message.success("Organization deleted successfully");
            fetchOrganizations();
          } else {
            const errorData = await response.json().catch(() => ({}));
            message.error(errorData.message || "Failed to delete organization");
          }
        } catch (error) {
          message.error(`Failed to delete organization: ${error}`);
        }
      }
    });
  };

  const getActionMenuItems = (record: OrganizationData): MenuProps["items"] => [
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: () => navigate(`/organizations/edit/${record.id}`)
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteIcon />,
      danger: true,
      onClick: () => handleDelete(record.id, record.name)
    }
  ];

  const filteredOrganizations = organizations.filter(
    (org) =>
      !searchText || org.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Organization",
      dataIndex: "name",
      key: "name",
      sorter: (a: OrganizationData, b: OrganizationData) =>
        a.name.localeCompare(b.name),
      render: (name: string, record: OrganizationData) => (
        <Space>
          {record.logo ? (
            <S3Image
              src={record.logo}
              alt={name}
              className={styles.orgLogo}
              fallback={<BankOutlined className={styles.orgIcon} />}
            />
          ) : (
            <BankOutlined className={styles.orgIcon} />
          )}
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: "Users",
      key: "users",
      sorter: (a: OrganizationData, b: OrganizationData) =>
        a._count.users - b._count.users,
      render: (_: unknown, record: OrganizationData) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {record._count.users}
        </Tag>
      )
    },
    {
      title: "Vessels",
      key: "vessels",
      sorter: (a: OrganizationData, b: OrganizationData) =>
        a._count.vessels - b._count.vessels,
      render: (_: unknown, record: OrganizationData) => (
        <Tag icon={<RocketOutlined />} color="green">
          {record._count.vessels}
        </Tag>
      )
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: OrganizationData, b: OrganizationData) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center" as const,
      render: (_: unknown, record: OrganizationData) => (
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

  if (loading) {
    return (
      <Card>
        <div className={styles.spinnerContainer}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <Title level={4}>Access Denied</Title>
        <Text type="secondary">
          Only Super Admins can manage organizations.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.headerContainer}>
        <div>
          <Title level={4} className={styles.headerTitle}>
            Organizations
          </Title>
          <Text type="secondary">Manage all organizations in the platform</Text>
        </div>
        <Link to="/organizations/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Add Organization
          </Button>
        </Link>
      </div>

      <div className={styles.filterRow}>
        <Input
          placeholder="Search by name"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
          allowClear
        />
      </div>

      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          dataSource={filteredOrganizations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </Card>
  );
};
