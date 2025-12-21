import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Upload,
  App,
  Space,
  Typography,
  Spin,
  Avatar
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  UserOutlined,
  CameraOutlined
} from "@ant-design/icons";
import { useApiUrl } from "@refinedev/core";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { useImageUrl } from "../../hooks";
import styles from "./settings.module.css";

const { Title, Text } = Typography;

interface UserData {
  id: string;
  name: string;
  email: string;
  signatureImage?: string;
  profileImage?: string;
  role: string;
}

export const UserProfile: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [signatureFileList, setSignatureFileList] = useState<UploadFile[]>([]);
  const apiUrl = useApiUrl();
  const { message } = App.useApp();

  // Use hooks to resolve image URLs (handles both S3 and local paths)
  const { url: profileImageUrl } = useImageUrl(user?.profileImage);
  const { url: signatureImageUrl, loading: signatureLoading } = useImageUrl(
    user?.signatureImage
  );

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update signature file list when URL is resolved or user changes
  useEffect(() => {
    if (user?.signatureImage) {
      if (signatureImageUrl) {
        // URL resolved - show the image
        setSignatureFileList([
          {
            uid: "-1",
            name: "signature",
            status: "done",
            url: signatureImageUrl
          }
        ]);
      } else if (signatureLoading) {
        // Still loading - show placeholder
        setSignatureFileList([
          {
            uid: "-1",
            name: "signature",
            status: "uploading"
          }
        ]);
      }
    } else {
      setSignatureFileList([]);
    }
  }, [user?.signatureImage, signatureImageUrl, signatureLoading]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        profileForm.setFieldsValue({
          name: data.name,
          email: data.email
        });
        // Signature file list will be updated via useEffect when signatureImageUrl resolves
      }
    } catch (error) {
      message.error(`Failed to load profile: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (values: { name: string }) => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: values.name })
      });
      if (response.ok) {
        message.success("Profile updated successfully");
        await fetchProfile();
        // Update localStorage user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = values.name;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } else {
        message.error("Failed to update profile");
      }
    } catch (error) {
      message.error(`Failed to update profile: ${error}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setSavingPassword(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      if (response.ok) {
        message.success("Password changed successfully");
        passwordForm.resetFields();
      } else {
        const error = await response.json();
        message.error(error.message || "Failed to change password");
      }
    } catch (error) {
      message.error(`Failed to change password: ${error}`);
    } finally {
      setSavingPassword(false);
    }
  };

  const profileImageUploadProps: UploadProps = {
    name: "file",
    action: `${apiUrl}/upload/profile-image`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`
    },
    showUploadList: false,
    accept: "image/*",
    beforeUpload(file) {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must be smaller than 2MB!");
        return false;
      }
      return true;
    },
    onChange(info) {
      if (info.file.status === "uploading") {
        setUploadingImage(true);
      }
      if (info.file.status === "done") {
        setUploadingImage(false);
        message.success("Profile image uploaded successfully");
        fetchProfile();
      } else if (info.file.status === "error") {
        setUploadingImage(false);
        message.error("Profile image upload failed");
      }
    }
  };

  const signatureUploadProps: UploadProps = {
    name: "file",
    action: `${apiUrl}/upload/signature`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`
    },
    listType: "picture",
    maxCount: 1,
    fileList: signatureFileList,
    async onChange(info) {
      // For S3 uploads, we need to resolve the URL after upload completes
      if (info.file.status === "done") {
        message.success("Signature uploaded successfully");
        // Fetch updated profile to get the new signature path and resolve URL
        fetchProfile();
      } else if (info.file.status === "error") {
        message.error("Signature upload failed");
        setSignatureFileList(info.fileList);
      } else {
        // For uploading state, update the file list normally
        setSignatureFileList(info.fileList);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" className={styles.fullWidth}>
      <Card>
        <Title level={4}>Profile Image</Title>
        <Text type="secondary">
          Upload a profile picture that will be displayed in the header.
        </Text>
        <div className={styles.profileImageSection}>
          <div className={styles.avatarWrapper}>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={profileImageUrl}
              className={styles.profileAvatar}
            />
            <Upload {...profileImageUploadProps}>
              <Button
                shape="circle"
                icon={<CameraOutlined />}
                size="small"
                className={styles.avatarUploadButton}
                loading={uploadingImage}
              />
            </Upload>
          </div>
          <Text type="secondary" className={styles.helpText}>
            Click the camera icon to upload a new image. Max size: 2MB.
          </Text>
        </div>
      </Card>

      <Card>
        <Title level={4}>Profile Information</Title>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileSave}
          className={styles.formContainerSmall}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="Enter your name" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={savingProfile}
            >
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Title level={4}>Digital Signature</Title>
        <Text type="secondary">
          Upload your signature image for official documents.
        </Text>
        <div className={styles.marginTop16}>
          <Upload {...signatureUploadProps}>
            <Button icon={<UploadOutlined />}>Upload Signature</Button>
          </Upload>
          <Text type="secondary" className={styles.helpTextBlock}>
            Recommended: PNG with transparent background, max 400x200 pixels
          </Text>
        </div>
      </Card>

      <Card>
        <Title level={4}>Change Password</Title>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className={styles.formContainerSmall}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter current password" }
            ]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 6, message: "Password must be at least 6 characters" }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                }
              })
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={savingPassword}
            >
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};
