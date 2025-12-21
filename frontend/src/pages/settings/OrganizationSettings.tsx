import { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Upload,
  Space,
  Typography,
  Spin,
  App
} from "antd";
import { UploadOutlined, SaveOutlined } from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { useImageUrl } from "../../hooks";
import styles from "./settings.module.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface OrganizationData {
  id: string;
  name: string;
  logoUrl?: string;
  defaultFormNo?: string;
  footerText?: string;
}

interface UserIdentity {
  id: string;
  role: string;
}

export const OrganizationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<OrganizationData | null>(
    null
  );
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { message } = App.useApp();

  const isAdmin = identity?.role === "ADMIN";

  // Use hook to resolve logo URL (handles both S3 and local paths)
  const { url: resolvedLogoUrl } = useImageUrl(organization?.logoUrl);

  const fetchOrganization = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/organization/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
        form.setFieldsValue({
          name: data.name,
          defaultFormNo: data.defaultFormNo,
          footerText: data.footerText
        });
        // Logo URL will be updated via useEffect when resolvedLogoUrl changes
        if (data.logoUrl) {
          setLogoFileList([
            {
              uid: "-1",
              name: "logo",
              status: "done",
              url: "" // Will be updated by useEffect
            }
          ]);
        }
      }
    } catch (error) {
      message.error(`Failed to load organization settings: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, form, message]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  // Update logo file list URL when resolved
  useEffect(() => {
    if (resolvedLogoUrl && logoFileList.length > 0) {
      setLogoFileList((prev) =>
        prev.map((file) => ({ ...file, url: resolvedLogoUrl }))
      );
    }
  }, [resolvedLogoUrl, logoFileList.length]);

  const handleSave = async (values: Record<string, string>) => {
    if (!organization) {
      message.error("Organization not loaded");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${apiUrl}/organization/${organization.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(values)
        }
      );

      if (response.ok) {
        message.success("Organization settings saved successfully");
        await fetchOrganization();
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Save error:", error);
      message.error(`Failed to save settings: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    action: `${apiUrl}/upload/logo`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`
    },
    listType: "picture",
    maxCount: 1,
    fileList: logoFileList,
    onChange(info) {
      setLogoFileList(info.fileList);
      if (info.file.status === "done") {
        message.success(`${info.file.name} uploaded successfully`);
        fetchOrganization();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} upload failed`);
      }
    },
    onRemove: async () => {
      // Optionally handle logo removal
      return true;
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <Text type="danger">
          You do not have permission to access this page.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Organization Settings</Title>
      <Text type="secondary">
        Configure your organization's branding and default settings.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className={styles.formContainerMarginTop}
      >
        <Form.Item
          name="name"
          label="Company Name"
          rules={[{ required: true, message: "Please enter company name" }]}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>

        <Form.Item label="Company Logo">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Upload Logo</Button>
          </Upload>
          <Text type="secondary" className={styles.helpText}>
            Recommended size: 200x60 pixels, PNG or JPG format
          </Text>
        </Form.Item>

        <Form.Item
          name="defaultFormNo"
          label="Default Form Number"
          tooltip="This will be pre-filled when creating new inspection reports"
        >
          <Input placeholder="e.g., FORM-001" />
        </Form.Item>

        <Form.Item
          name="footerText"
          label="PDF Footer Text"
          tooltip="This text will appear at the bottom of exported PDF reports"
        >
          <TextArea rows={3} placeholder="Enter footer text for PDF exports" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              Save Settings
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
