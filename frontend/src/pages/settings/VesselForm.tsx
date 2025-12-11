import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Spin,
  message,
  Space
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import styles from "./settings.module.css";

const { Title, Text } = Typography;

interface UserData {
  id: string;
  name: string;
  role: string;
  assignedVessel?: { id: string };
}

interface VesselFormValues {
  name: string;
  imoNumber?: string;
  callSign?: string;
  flag?: string;
  shipFileNo?: string;
  captainId?: string;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const VesselForm: React.FC = () => {
  const [form] = Form.useForm<VesselFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [captains, setCaptains] = useState<UserData[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();

  const isEdit = Boolean(id);
  const isAdmin = identity?.role === "ADMIN";

  const fetchCaptains = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const users = Array.isArray(data) ? data : data.data || [];
        // Filter captains who are not assigned to a vessel (or assigned to this vessel)
        const availableCaptains = users.filter(
          (u: UserData) =>
            u.role === "CAPTAIN" &&
            (!u.assignedVessel || (isEdit && u.assignedVessel?.id === id))
        );
        setCaptains(availableCaptains);
      }
    } catch (error) {
      message.error(`Failed to load captains: ${error}`);
    }
  }, [apiUrl, isEdit, id]);

  const fetchVessel = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/vessels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const vessel = await response.json();
        form.setFieldsValue({
          name: vessel.name,
          imoNumber: vessel.imoNumber,
          callSign: vessel.callSign,
          flag: vessel.flag,
          shipFileNo: vessel.shipFileNo,
          captainId: vessel.captain?.id
        });
      } else {
        message.error("Failed to load vessel");
        navigate("/vessels");
      }
    } catch (error) {
      message.error(`Failed to load vessel: ${error}`);
      navigate("/vessels");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id, form, navigate]);

  useEffect(() => {
    fetchCaptains();
    if (isEdit) {
      fetchVessel();
    }
  }, [isEdit, fetchCaptains, fetchVessel]);

  const handleSubmit = async (values: VesselFormValues) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const url = isEdit ? `${apiUrl}/vessels/${id}` : `${apiUrl}/vessels`;
      const method = isEdit ? "PATCH" : "POST";

      // Separate captain assignment from vessel data
      const { captainId, ...vesselData } = values;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vesselData)
      });

      if (response.ok) {
        const vessel = await response.json();

        // Handle captain assignment separately if needed
        if (captainId) {
          await fetch(
            `${apiUrl}/vessels/${vessel.id}/assign-captain/${captainId}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        }

        message.success(
          `Vessel ${isEdit ? "updated" : "created"} successfully`
        );
        navigate("/vessels");
      } else {
        const error = await response.json();
        message.error(
          error.message || `Failed to ${isEdit ? "update" : "create"} vessel`
        );
      }
    } catch (error) {
      message.error(
        `Failed to ${isEdit ? "update" : "create"} vessel: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

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
            {isEdit ? "Edit Vessel" : "Add New Vessel"}
          </Title>
          <Text type="secondary">
            {isEdit
              ? "Update vessel information and captain assignment"
              : "Register a new vessel in the system"}
          </Text>
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/vessels")}
        >
          Back to Vessels
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={styles.formContainer}
      >
        <div className={styles.formSection}>
          <Title level={5} className={styles.formSectionTitle}>
            Vessel Information
          </Title>

          <Form.Item
            name="name"
            label="Vessel Name"
            rules={[
              { required: true, message: "Please enter the vessel name" },
              { min: 2, message: "Name must be at least 2 characters" }
            ]}
          >
            <Input placeholder="Enter vessel name" />
          </Form.Item>

          <Form.Item name="imoNumber" label="IMO Number">
            <Input placeholder="e.g., IMO1234567" maxLength={20} />
          </Form.Item>

          <Form.Item name="callSign" label="Call Sign">
            <Input placeholder="Enter call sign" maxLength={20} />
          </Form.Item>

          <Form.Item name="flag" label="Flag State">
            <Input placeholder="e.g., Singapore, Panama" maxLength={100} />
          </Form.Item>

          <Form.Item name="shipFileNo" label="Ship File Number">
            <Input placeholder="Enter ship file number" maxLength={50} />
          </Form.Item>
        </div>

        <div className={styles.formSection}>
          <Title level={5} className={styles.formSectionTitle}>
            Captain Assignment
          </Title>

          <Form.Item name="captainId" label="Assigned Captain">
            <Select
              placeholder="Select a captain to assign"
              allowClear
              options={captains.map((c) => ({
                value: c.id,
                label: c.name || c.id
              }))}
            />
          </Form.Item>
          <Text type="secondary" className={styles.hint}>
            Only captains without a vessel assignment are shown
          </Text>
        </div>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              {isEdit ? "Save Changes" : "Create Vessel"}
            </Button>
            <Button onClick={() => navigate("/vessels")}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
