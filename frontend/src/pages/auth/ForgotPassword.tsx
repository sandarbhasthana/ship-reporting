import { useState } from "react";
import { Button, Form, Alert, Result } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link } from "react-router";
import { FloatingInput } from "../../components/FloatingLabel";
import { API_URL } from "../../providers/dataProvider";
import styles from "./auth.module.css";

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordPage = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send reset email");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <Result
            status="success"
            title="Check Your Email"
            subTitle="If an account exists with that email, we've sent password reset instructions."
            extra={
              <Link to="/login">
                <Button type="primary" size="large">
                  Back to Sign In
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
          <span className={styles.logoIcon}>🔐</span>
          <h1 className={styles.title}>Forgot Password</h1>
          <p className={styles.subtitle}>
            Enter your email and we'll send you a reset link
          </p>
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

          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className={styles.submitButton}
            block
          >
            Send Reset Link
          </Button>
        </Form>

        <div className={styles.backLink}>
          <Link to="/login" className={styles.backLinkText}>
            <ArrowLeftOutlined /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

