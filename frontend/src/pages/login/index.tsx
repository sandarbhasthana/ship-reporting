import { AuthPage } from "@refinedev/antd";

export const LoginPage = () => {
  return (
    <AuthPage
      type="login"
      title="Ship Reporting"
      formProps={{
        initialValues: {
          email: "admin@example.com",
          password: "password",
        },
      }}
    />
  );
};

