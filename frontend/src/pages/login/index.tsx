import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Button, Form, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link } from "react-router";
import {
  FloatingInput,
  FloatingPassword
} from "../../components/FloatingLabel";
import styles from "./Login.module.css";

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const { mutate: login, isPending } = useLogin<LoginFormValues>();
  const [error, setError] = useState<string | null>(null);

  const onFinish = (values: LoginFormValues) => {
    setError(null);
    login(values, {
      onError: (err) => {
        setError(err?.message || "Invalid email or password");
      }
    });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon}>🚢</span>
          <h1 className={styles.title}>Ship Reporting</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
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
          className={styles.loginForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            className={styles.formItem}
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <FloatingInput
              label="Email"
              prefix={<MailOutlined />}
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            className={styles.formItem}
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <FloatingPassword
              label="Password"
              prefix={<LockOutlined />}
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            className={styles.submitButton}
            block
          >
            Sign In
          </Button>
        </Form>

        <div className={styles.forgotPassword}>
          <Link to="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};
