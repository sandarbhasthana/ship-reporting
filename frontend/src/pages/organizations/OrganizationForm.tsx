import { useEffect, useState } from "react";
import { Card, Form, Button, Typography, Spin, App, Row, Col } from "antd";
import {
  BankOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  LockOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { FloatingInput } from "../../components";
import styles from "./organizations.module.css";

const { Title, Text } = Typography;

interface OrganizationFormData {
  name: string;
  email?: string;
  phone?: string;
  owner?: string;
  logo?: string;
  defaultFormNo?: string;
  footerText?: string;
  adminPassword?: string;
  confirmPassword?: string;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const OrganizationForm: React.FC = () => {
  const [form] = Form.useForm<OrganizationFormData>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const isSuperAdmin = identity?.role === "SUPER_ADMIN";

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) {
        setInitialLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiUrl}/organization/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          form.setFieldsValue({
            name: data.name,
            email: data.email,
            phone: data.phone,
            owner: data.owner,
            logo: data.logo,
            defaultFormNo: data.defaultFormNo,
            footerText: data.footerText
          });
        } else {
          message.error("Failed to load organization");
          navigate("/organizations");
        }
      } catch (error) {
        message.error(`Failed to load organization: ${error}`);
        navigate("/organizations");
      } finally {
        setInitialLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchOrganization();
    } else {
      setInitialLoading(false);
    }
  }, [id, apiUrl, form, navigate, message, isSuperAdmin]);

  const handleSubmit = async (values: OrganizationFormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const url = isEdit
        ? `${apiUrl}/organization/${id}`
        : `${apiUrl}/organization`;

      // Remove confirmPassword before sending to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _confirmPassword, ...dataToSend } = values;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        message.success(
          isEdit
            ? "Organization updated successfully"
            : "Organization created successfully"
        );
        navigate("/organizations");
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(
          errorData.message ||
            `Failed to ${isEdit ? "update" : "create"} organization`
        );
      }
    } catch (error) {
      message.error(
        `Failed to ${isEdit ? "update" : "create"} organization: ${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  // Organization form (Create/Edit)
  return (
    <Card>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/organizations")}
        style={{ padding: 0, marginBottom: 8 }}
      >
        Back to Organizations
      </Button>
      <Title level={4} className={styles.headerTitle}>
        {isEdit ? "Edit Organization" : "Create Organization"}
      </Title>
      <Text type="secondary">
        {isEdit
          ? "Update organization details"
          : "Add a new organization to the platform"}
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={styles.form}
      >
        {/* Organization Info Section */}
        <div className={styles.formSection}>
          <Title level={5} className={styles.sectionTitle}>
            <BankOutlined /> Organization Info
          </Title>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: "Please enter organization name" },
                  { min: 2, message: "Name must be at least 2 characters" },
                  { max: 255, message: "Name must be less than 255 characters" }
                ]}
              >
                <FloatingInput
                  label="Organization Name"
                  required
                  prefix={<BankOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please enter organization email"
                  },
                  { type: "email", message: "Please enter a valid email" }
                ]}
              >
                <FloatingInput
                  label="Organization Email"
                  required
                  prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="phone">
                <FloatingInput
                  label="Phone Number"
                  prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="owner">
                <FloatingInput
                  label="Owner / Primary Contact"
                  prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Admin Credentials Section - Only for Create */}
        {!isEdit && (
          <div className={styles.formSection}>
            <Title level={5} className={styles.sectionTitle}>
              <LockOutlined /> Admin Credentials
            </Title>
            <Text type="secondary" className={styles.sectionDescription}>
              Set the initial login credentials for the organization admin. They
              can change this from their settings.
            </Text>
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adminPassword"
                  rules={[
                    { required: true, message: "Please enter admin password" },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters"
                    }
                  ]}
                >
                  <FloatingInput
                    label="Admin Password"
                    required
                    type="password"
                    prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="confirmPassword"
                  dependencies={["adminPassword"]}
                  rules={[
                    { required: true, message: "Please confirm password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          !value ||
                          getFieldValue("adminPassword") === value
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match")
                        );
                      }
                    })
                  ]}
                >
                  <FloatingInput
                    label="Confirm Password"
                    required
                    type="password"
                    prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        <Form.Item className={styles.formActions}>
          <Button
            onClick={() => navigate("/organizations")}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? "Update Organization" : "Create Organization"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
