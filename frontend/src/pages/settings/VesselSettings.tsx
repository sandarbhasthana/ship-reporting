import { useCallback, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  message,
  Space,
  Typography,
  Spin,
  Table
} from "antd";
import { EditOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
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

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "IMO Number", dataIndex: "imoNumber", key: "imoNumber" },
    { title: "Call Sign", dataIndex: "callSign", key: "callSign" },
    { title: "Flag", dataIndex: "flag", key: "flag" },
    { title: "Ship File No", dataIndex: "shipFileNo", key: "shipFileNo" },
    {
      title: "Captain",
      key: "captain",
      render: (_: unknown, record: VesselData) => record.captain?.name || "-"
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: VesselData) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          disabled={!isAdmin}
        >
          Edit
        </Button>
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
