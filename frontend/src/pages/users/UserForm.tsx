import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Form,
  Button,
  Switch,
  Typography,
  Spin,
  message,
  Row,
  Col
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import {
  FloatingInput,
  FloatingPassword,
  FloatingSelect
} from "../../components";
import styles from "./users.module.css";

const { Title, Text } = Typography;

interface VesselData {
  id: string;
  name: string;
  captain?: { id: string };
}

interface UserFormValues {
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "CAPTAIN";
  assignedVesselId?: string;
  isActive: boolean;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const UserForm: React.FC = () => {
  const [form] = Form.useForm<UserFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();

  const isEdit = Boolean(id);
  const isAdmin = identity?.role === "ADMIN";
  const selectedRole = Form.useWatch("role", form);
  const isActive = Form.useWatch("isActive", form);

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
    }
  }, [apiUrl]);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        form.setFieldsValue({
          name: user.name,
          email: user.email,
          role: user.role,
          assignedVesselId: user.assignedVessel?.id,
          isActive: user.isActive
        });
      } else {
        message.error("Failed to load user");
        navigate("/users");
      }
    } catch (error) {
      message.error(`Failed to load user: ${error}`);
      navigate("/users");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id, form, navigate]);

  useEffect(() => {
    fetchVessels();
    if (isEdit) {
      fetchUser();
    }
  }, [isEdit, fetchVessels, fetchUser]);

  const handleSubmit = async (values: UserFormValues) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const url = isEdit ? `${apiUrl}/users/${id}` : `${apiUrl}/users`;
      const method = isEdit ? "PATCH" : "POST";

      // Clean up payload
      const payload: Record<string, unknown> = { ...values };
      if (values.role !== "CAPTAIN") {
        delete payload.assignedVesselId;
      }
      if (isEdit && !values.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success(`User ${isEdit ? "updated" : "created"} successfully`);
        navigate("/users");
      } else {
        const error = await response.json();
        message.error(
          error.message || `Failed to ${isEdit ? "update" : "create"} user`
        );
      }
    } catch (error) {
      message.error(`Failed to ${isEdit ? "update" : "create"} user: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter vessels - show unassigned vessels or the currently assigned one
  const availableVessels = vessels.filter(
    (v) => !v.captain || (isEdit && v.captain?.id === id)
  );

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
            {isEdit ? "Edit User" : "Add New User"}
          </Title>
          <Text type="secondary">
            {isEdit
              ? "Update user information and settings"
              : "Onboard a new team member to the system"}
          </Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")}>
          Back to Users
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={styles.formContainer}
        initialValues={{ role: "CAPTAIN", isActive: true }}
      >
        <div className={styles.formSection}>
          <Title level={5} className={styles.formSectionTitle}>
            Basic Information
          </Title>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: "Please enter the user's name" },
                  { min: 2, message: "Name must be at least 2 characters" }
                ]}
              >
                <FloatingInput
                  label="Full Name"
                  required
                  prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please enter an email address" },
                  { type: "email", message: "Please enter a valid email" }
                ]}
              >
                <FloatingInput
                  label="Email Address"
                  required
                  prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                rules={
                  isEdit
                    ? [
                        {
                          min: 6,
                          message: "Password must be at least 6 characters"
                        }
                      ]
                    : [
                        { required: true, message: "Please enter a password" },
                        {
                          min: 6,
                          message: "Password must be at least 6 characters"
                        }
                      ]
                }
                extra={
                  isEdit ? (
                    <Text type="secondary" className={styles.passwordHint}>
                      Only enter a password if you want to change it
                    </Text>
                  ) : null
                }
              >
                <FloatingPassword
                  label={isEdit ? "New Password (optional)" : "Password"}
                  required={!isEdit}
                  prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="isActive"
                label="Account Status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                  style={{
                    backgroundColor: isActive !== false ? "#059669" : "#e11d48",
                    marginTop: 8
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className={styles.formSection}>
          <Title level={5} className={styles.formSectionTitle}>
            Role & Assignment
          </Title>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                rules={[{ required: true, message: "Please select a role" }]}
              >
                <FloatingSelect
                  label="Role"
                  required
                  size="large"
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "CAPTAIN", label: "Captain" }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              {selectedRole === "CAPTAIN" && (
                <Form.Item
                  name="assignedVesselId"
                  extra={
                    <Text type="secondary" className={styles.passwordHint}>
                      A captain can only be assigned to one vessel
                    </Text>
                  }
                >
                  <FloatingSelect
                    label="Assigned Vessel"
                    allowClear
                    size="large"
                    options={availableVessels.map((v) => ({
                      value: v.id,
                      label: v.name
                    }))}
                  />
                </Form.Item>
              )}
            </Col>
          </Row>
        </div>

        <div className={styles.formActions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
          >
            {isEdit ? "Save Changes" : "Create User"}
          </Button>
          <Button onClick={() => navigate("/users")}>Cancel</Button>
        </div>
      </Form>
    </Card>
  );
};
