import { useCallback, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Space,
  Typography,
  Spin,
  Table,
  Dropdown,
  App
} from "antd";
import type { MenuProps } from "antd";
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useNavigate } from "react-router";
import styles from "./settings.module.css";

const { Title, Text } = Typography;

interface VesselData {
  id: string;
  name: string;
  imoNumber?: string;
  callSign?: string;
  flag?: string;
  shipFileNo?: string;
  captain?: { id: string; name: string };
}

interface UserData {
  id: string;
  name: string;
  role: string;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const VesselSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [captains, setCaptains] = useState<UserData[]>([]);
  const [editingVessel, setEditingVessel] = useState<VesselData | null>(null);
  const [isModalMode, setIsModalMode] = useState(false);
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const isAdmin = identity?.role === "ADMIN";

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
      message.error(`Failed to load vessels: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchCaptains = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/users?role=CAPTAIN`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCaptains(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      message.error(`Failed to load captains: ${error}`);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchVessels();
    if (isAdmin) {
      fetchCaptains();
    }
  }, [isAdmin, fetchVessels, fetchCaptains]);

  const handleEdit = (vessel: VesselData) => {
    setEditingVessel(vessel);
    setIsModalMode(true);
    form.setFieldsValue({
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      callSign: vessel.callSign,
      flag: vessel.flag,
      shipFileNo: vessel.shipFileNo,
      captainId: vessel.captain?.id
    });
  };

  const handleSave = async (values: Record<string, string>) => {
    if (!editingVessel) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/vessels/${editingVessel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      if (response.ok) {
        message.success("Vessel settings saved successfully");
        setIsModalMode(false);
        setEditingVessel(null);
        form.resetFields();
        await fetchVessels();
      } else {
        message.error("Failed to save vessel settings");
      }
    } catch (error) {
      message.error(`Failed to save vessel settings: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalMode(false);
    setEditingVessel(null);
    form.resetFields();
  };

  const handleDelete = (vessel: VesselData) => {
    // Check if vessel has a captain assigned
    if (vessel.captain) {
      message.error(
        `Cannot delete "${vessel.name}". Please unassign the captain "${vessel.captain.name}" first.`
      );
      return;
    }

    modal.confirm({
      title: "Delete Vessel",
      content: `Are you sure you want to delete "${vessel.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/vessels/${vessel.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            message.success("Vessel deleted successfully");
            fetchVessels();
          } else {
            const errorData = await response.json().catch(() => ({}));
            message.error(errorData.message || "Failed to delete vessel");
          }
        } catch (error) {
          message.error(`Failed to delete vessel: ${error}`);
        }
      }
    });
  };

  const getActionMenuItems = (record: VesselData): MenuProps["items"] => {
    const items: MenuProps["items"] = [
      {
        key: "view",
        label: "View",
        icon: <EyeOutlined />,
        onClick: () => navigate(`/vessels/${record.id}`)
      },
      {
        key: "edit",
        label: "Edit",
        icon: <EditOutlined />,
        onClick: () => handleEdit(record)
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(record)
      }
    ];

    return items;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: VesselData, b: VesselData) =>
        (a.name || "").localeCompare(b.name || "")
    },
    {
      title: "IMO Number",
      dataIndex: "imoNumber",
      key: "imoNumber",
      sorter: (a: VesselData, b: VesselData) =>
        (a.imoNumber || "").localeCompare(b.imoNumber || "")
    },
    {
      title: "Call Sign",
      dataIndex: "callSign",
      key: "callSign",
      sorter: (a: VesselData, b: VesselData) =>
        (a.callSign || "").localeCompare(b.callSign || "")
    },
    {
      title: "Flag",
      dataIndex: "flag",
      key: "flag",
      sorter: (a: VesselData, b: VesselData) =>
        (a.flag || "").localeCompare(b.flag || "")
    },
    {
      title: "Ship File No",
      dataIndex: "shipFileNo",
      key: "shipFileNo",
      sorter: (a: VesselData, b: VesselData) =>
        (a.shipFileNo || "").localeCompare(b.shipFileNo || "")
    },
    {
      title: "Captain",
      key: "captain",
      sorter: (a: VesselData, b: VesselData) =>
        (a.captain?.name || "").localeCompare(b.captain?.name || ""),
      render: (_: unknown, record: VesselData) => record.captain?.name || "-"
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center" as const,
      render: (_: unknown, record: VesselData) => (
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
        <Spin size="large" />
      </Card>
    );
  }

  if (isModalMode && editingVessel) {
    return (
      <Card>
        <Title level={4}>Edit Vessel: {editingVessel.name}</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className={styles.formContainer}
        >
          <Form.Item
            name="name"
            label="Vessel Name"
            rules={[{ required: true, message: "Please enter vessel name" }]}
          >
            <Input placeholder="Enter vessel name" />
          </Form.Item>

          <Form.Item name="imoNumber" label="IMO Number">
            <Input placeholder="e.g., IMO1234567" />
          </Form.Item>

          <Form.Item name="callSign" label="Call Sign">
            <Input placeholder="Enter call sign" />
          </Form.Item>

          <Form.Item name="flag" label="Flag State">
            <Input placeholder="e.g., Singapore, Panama" />
          </Form.Item>

          <Form.Item name="shipFileNo" label="Ship File Number">
            <Input placeholder="Enter ship file number" />
          </Form.Item>

          {isAdmin && (
            <Form.Item name="captainId" label="Assigned Captain">
              <Select
                placeholder="Select a captain"
                allowClear
                options={captains.map((c) => ({
                  value: c.id,
                  label: c.name
                }))}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.headerContainer}>
        <div>
          <Title level={4} className={styles.headerTitle}>
            Vessel Settings
          </Title>
          <Text type="secondary">
            Manage vessel details and captain assignments.
          </Text>
        </div>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} href="/vessels/create">
            Add Vessel
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={vessels}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};
