import { useState, type ReactNode } from "react";
import { Input, InputNumber, Select, DatePicker } from "antd";
import type { InputProps, InputNumberProps } from "antd";
import type { SelectProps } from "antd/es/select";
import type { DatePickerProps } from "antd/es/date-picker";
import type { TextAreaProps } from "antd/es/input";
import styles from "./FloatingLabel.module.css";

const { TextArea, Password } = Input;

interface FloatingLabelWrapperProps {
  label: string;
  value?: unknown;
  focused?: boolean;
  children: ReactNode;
  required?: boolean;
  hasPrefix?: boolean;
}

const FloatingLabelWrapper = ({
  label,
  value,
  focused,
  children,
  required,
  hasPrefix
}: FloatingLabelWrapperProps) => {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== false;
  const isFloating = focused || hasValue;

  const containerClasses = [
    styles.floatingLabelContainer,
    isFloating ? styles.floating : "",
    hasPrefix ? styles.hasPrefix : ""
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = [styles.floatingLabel, required ? styles.required : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {children}
      <label className={labelClasses}>{label}</label>
    </div>
  );
};

interface FloatingInputProps extends Omit<InputProps, "placeholder"> {
  label: string;
  required?: boolean;
}

export const FloatingInput = ({
  label,
  required,
  value,
  prefix,
  ...props
}: FloatingInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
      hasPrefix={!!prefix}
    >
      <Input
        {...props}
        value={value}
        prefix={prefix}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </FloatingLabelWrapper>
  );
};

interface FloatingPasswordProps extends Omit<InputProps, "placeholder"> {
  label: string;
  required?: boolean;
}

export const FloatingPassword = ({
  label,
  required,
  value,
  prefix,
  ...props
}: FloatingPasswordProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
      hasPrefix={!!prefix}
    >
      <Password
        {...props}
        value={value}
        prefix={prefix}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </FloatingLabelWrapper>
  );
};

interface FloatingTextAreaProps extends Omit<TextAreaProps, "placeholder"> {
  label: string;
  required?: boolean;
}

export const FloatingTextArea = ({
  label,
  required,
  value,
  ...props
}: FloatingTextAreaProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
    >
      <TextArea
        {...props}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </FloatingLabelWrapper>
  );
};

interface FloatingSelectProps extends Omit<SelectProps, "placeholder"> {
  label: string;
  required?: boolean;
}

export const FloatingSelect = ({
  label,
  required,
  value,
  ...props
}: FloatingSelectProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
    >
      <Select
        {...props}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", ...props.style }}
      />
    </FloatingLabelWrapper>
  );
};

interface FloatingInputNumberProps extends Omit<
  InputNumberProps,
  "placeholder"
> {
  label: string;
  required?: boolean;
}

export const FloatingInputNumber = ({
  label,
  required,
  value,
  ...props
}: FloatingInputNumberProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
    >
      <InputNumber
        {...props}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", ...props.style }}
      />
    </FloatingLabelWrapper>
  );
};

interface FloatingDatePickerProps extends Omit<DatePickerProps, "placeholder"> {
  label: string;
  required?: boolean;
}

export const FloatingDatePicker = ({
  label,
  required,
  value,
  ...props
}: FloatingDatePickerProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <FloatingLabelWrapper
      label={label}
      value={value}
      focused={focused}
      required={required}
    >
      <DatePicker
        {...props}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", ...props.style }}
      />
    </FloatingLabelWrapper>
  );
};
