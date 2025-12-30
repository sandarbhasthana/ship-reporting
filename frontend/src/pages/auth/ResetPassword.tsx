import { useState } from "react";
import { Button, Form, Alert, Result } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router";
import { FloatingPassword } from "../../components/FloatingLabel";
import { API_URL } from "../../providers/dataProvider";
import styles from "./auth.module.css";

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <Result
            status="error"
            title="Invalid Reset Link"
            subTitle="This password reset link is invalid or has expired."
            extra={
              <Link to="/forgot-password">
                <Button type="primary" size="large">
                  Request New Link
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <Result
            status="success"
            title="Password Reset Successful"
            subTitle="Your password has been reset. You can now sign in with your new password."
            extra={
              <Link to="/login">
                <Button type="primary" size="large">
                  Sign In
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon}>🔑</span>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your new password below</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className={styles.errorMessage}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          onFinish={onFinish}
          className={styles.authForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="newPassword"
            className={styles.formItem}
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters" }
            ]}
          >
            <FloatingPassword
              label="New Password"
              prefix={<LockOutlined />}
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            className={styles.formItem}
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your password" },
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
            <FloatingPassword
              label="Confirm Password"
              prefix={<LockOutlined />}
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className={styles.submitButton}
            block
          >
            Reset Password
          </Button>
        </Form>
      </div>
    </div>
  );
};

