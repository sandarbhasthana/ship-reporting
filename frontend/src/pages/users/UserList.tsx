import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Spin,
  Input,
  Select,
  Dropdown,
  App
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import styles from "./users.module.css";

const { Title, Text } = Typography;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CAPTAIN";
  isActive: boolean;
  assignedVessel?: { id: string; name: string };
  organization?: { id: string; name: string };
  createdAt: string;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const UserList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const isAdmin = identity?.role === "ADMIN";

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        message.error("No authentication token found. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.data || []);
      } else if (response.status === 401) {
        message.error("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        message.error(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else {
        message.error(`Failed to load users: ${error}`);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeactivate = (userId: string) => {
    modal.confirm({
      title: "Deactivate User",
      content:
        "Are you sure you want to deactivate this user? They will no longer be able to log in.",
      okText: "Deactivate",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ isActive: false })
          });
          if (response.ok) {
            message.success("User deactivated successfully");
            fetchUsers();
          } else {
            message.error("Failed to deactivate user");
          }
        } catch (error) {
          message.error(`Failed to deactivate user: ${error}`);
        }
      }
    });
  };

  const handleReactivate = async (userId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: true })
      });
      if (response.ok) {
        message.success("User reactivated successfully");
        fetchUsers();
      } else {
        message.error("Failed to reactivate user");
      }
    } catch (error) {
      message.error(`Failed to reactivate user: ${error}`);
    }
  };

  const handleDelete = (userId: string) => {
    modal.confirm({
      title: "Delete User Permanently",
      content:
        "Are you sure you want to permanently delete this user? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/users/${userId}/hard`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            message.success("User deleted permanently");
            fetchUsers();
          } else {
            message.error("Failed to delete user");
          }
        } catch (error) {
          message.error(`Failed to delete user: ${error}`);
        }
      }
    });
  };

  const getActionMenuItems = (record: UserData): MenuProps["items"] => {
    const items: MenuProps["items"] = [
      {
        key: "edit",
        label: "Edit",
        icon: <EditOutlined />,
        onClick: () => navigate(`/users/edit/${record.id}`)
      }
    ];

    if (record.isActive) {
      items.push({
        key: "deactivate",
        label: "Deactivate",
        icon: <StopOutlined />,
        danger: true,
        disabled: record.id === identity?.id,
        onClick: () => handleDeactivate(record.id)
      });
    } else {
      items.push({
        key: "reactivate",
        label: "Reactivate",
        icon: <CheckCircleOutlined />,
        onClick: () => handleReactivate(record.id)
      });
    }

    items.push({
      key: "delete",
      label: "Delete Permanently",
      icon: <DeleteOutlined />,
      danger: true,
      disabled: record.id === identity?.id,
      onClick: () => handleDelete(record.id)
    });

    return items;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchText ||
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus =
      statusFilter === undefined ||
      (statusFilter === "active" ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: UserData, b: UserData) =>
        (a.name || "").localeCompare(b.name || ""),
      render: (name: string) => name || "-"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a: UserData, b: UserData) =>
        (a.email || "").localeCompare(b.email || "")
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: (a: UserData, b: UserData) => a.role.localeCompare(b.role),
      render: (role: string) => (
        <span
          className={role === "ADMIN" ? styles.badgeAdmin : styles.badgeCaptain}
        >
          {role}
        </span>
      )
    },
    {
      title: "Assigned Vessel",
      key: "assignedVessel",
      sorter: (a: UserData, b: UserData) =>
        (a.assignedVessel?.name || "").localeCompare(
          b.assignedVessel?.name || ""
        ),
      render: (_: unknown, record: UserData) =>
        record.assignedVessel?.name || "-"
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: (a: UserData, b: UserData) =>
        Number(b.isActive) - Number(a.isActive),
      render: (isActive: boolean) => (
        <span className={isActive ? styles.badgeActive : styles.badgeInactive}>
          {isActive ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center" as const,
      render: (_: unknown, record: UserData) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={["click"]}
          placement="bottomRight"
          disabled={!isAdmin}
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

  if (!isAdmin) {
    return (
      <Card>
        <Title level={4}>Access Denied</Title>
        <Text type="secondary">
          You don't have permission to view this page.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.headerContainer}>
        <div>
          <Title level={4} className={styles.headerTitle}>
            Users Management
          </Title>
          <Text type="secondary">
            Manage users and onboard new team members
          </Text>
        </div>
        <Link to="/users/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Add User
          </Button>
        </Link>
      </div>

      <div className={styles.filterRow}>
        <Input
          placeholder="Search by name or email"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={setRoleFilter}
          allowClear
          className={styles.filterItem}
          options={[
            { value: "ADMIN", label: "Admin" },
            { value: "CAPTAIN", label: "Captain" }
          ]}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          className={styles.filterItem}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" }
          ]}
        />
      </div>

      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </Card>
  );
};
