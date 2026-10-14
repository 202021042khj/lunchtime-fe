"use client";

import { forwardRef, ReactNode, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import Loading from "@/components/ui/loading";

import Slot, { AsChildProps, Slottable } from "@/components/ui/slot";

interface Props extends ComponentPropsWithoutRef<"button"> {
  isLoading?: boolean;
  variant?: Variant;
  color?: Color;
  size?: Size;
  shape?: Shape;
  shadow?: Shadow;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export type ButtonProps = AsChildProps<Props>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      isLoading,
      children,
      className,
      disabled,
      variant = "solid",
      color = "blue",
      size = "lg",
      shape = "default",
      shadow = "none",
      leftIcon,
      rightIcon,
      ...props
    },

    ref,
  ) => {
    const Element = asChild ? Slot : "button";

    return (
      <Element
        className={cn(
          buttonVariants({ variant, color, size, shape, shadow, disabled }),
          className,
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loading
            className={cn(
              LOADING_SIZE_MAP[size],
              LOADING_COLOR_MAP[variant][color],
              disabled && "text-[#9F9F9F]",
            )}
          />
        ) : (
          <>
            {leftIcon && leftIcon}
            <Slottable>{children}</Slottable>
            {rightIcon && rightIcon}
          </>
        )}
      </Element>
    );
  },
);

type Variant = "solid" | "filled" | "outlined" | "text" | "icon";
type Color = "blue" | "red" | "black" | "brand";
type Size = "sm" | "md" | "lg" | "icon";
type Shape = "default" | "circle" | "round";
type Shadow = "none" | "red" | "blue" | "default";

const BUTTON_VARIANT_MAP: Record<Variant, Record<Color, string>> = {
  solid: {
    blue: "bg-primary-main-blue text-white",
    red: "bg-primary-main-red text-white",
    black: "bg-black text-white",
    brand: "bg-brand-primary text-white hover:brightness-95",
  },
  filled: {
    blue: "bg-primary-sub-blue-100 text-primary-main-blue hover:bg-primary-sub-blue-300",
    red: "bg-primary-sub-red-100 text-primary-main-red hover:bg-primary-sub-red-500",
    black: "bg-gray-200 text-black",
    brand: "bg-brand-primary-tint text-brand-primary",
  },
  outlined: {
    blue: "bg-white border border-primary-sub-blue-500 text-primary-main-blue hover:bg-primary-sub-blue-100",
    red: "bg-white border border-primary-sub-red-500 text-primary-main-red hover:bg-primary-sub-red-500",
    black: "bg-white border border-gray-300 text-black hover:bg-gray-200",
    brand: "bg-glass-card border border-glass-border text-labels-primary shadow-glass",
  },
  text: {
    blue: "text-primary-main-blue hover:text-primary-sub-blue-500 bg-transparent px-0",
    red: "text-primary-main-red bg-transparent px-0",
    black: "text-black bg-transparent px-0",
    brand: "text-brand-primary bg-transparent px-0",
  },
  icon: {
    blue: "text-primary-main-blue",
    red: "text-primary-main-red",
    black: "text-black",
    brand: "text-brand-primary",
  },
};

const BUTTON_SIZE_MAP: Record<Shape, Record<Size, string>> = {
  default: {
    lg: "px-[43px] h-[50px]",
    md: "px-[16px] h-[43px]",
    sm: "px-[16px] h-[33px]",
    icon: "h-9 w-9",
  },
  circle: {
    lg: "px-[43px] h-[50px]",
    md: "px-[16px] h-[43px]",
    sm: "px-[16px] h-[33px]",
    icon: "h-9 w-9",
  },
  round: {
    lg: "px-[43px] h-[50px]",
    md: "px-[16px] h-[43px]",
    sm: "px-[16px] h-[33px]",
    icon: "h-9 w-9",
  },
};
const BUTTON_TEXT_SIZE_MAP: Record<Size, string> = {
  lg: "text-font-16-500",
  md: "text-font-16-500",
  sm: "text-font-14-400",
  icon: "text-font-14-400",
};

const BUTTON_SHAPE_MAP: Record<Shape, string> = {
  default: "rounded-[8px]",
  circle: "rounded-full",
  round: "rounded-full",
};

const BUTTON_SHADOW_MAP: Record<Shadow, string> = {
  none: "",
  red: "shadow-red disabled:shadow-gray-500",
  blue: "shadow-blue disabled:shadow-gray-500",
  default: "shadow-default",
};

const BUTTON_DISABLED_MAP: Record<Variant, string> = {
  solid: "bg-gray-300 text-white hover:bg-gray-300",
  filled: "bg-gray-300 text-gray-600 hover:bg-gray-300",
  outlined:
    "text-gray-600 border-gray-300 bg-white hover:bg-white hover:border-gray-300",
  text: "text-gray-600",
  icon: "text-gray-600",
};

const LOADING_COLOR_MAP: Record<Variant, Record<Color, string>> = {
  solid: {
    blue: "#ffffff",
    red: "#ffffff",
    black: "#ffffff",
    brand: "#ffffff",
  },
  filled: {
    blue: "#476cff",
    red: "#ffffff",
    black: "#000000",
    brand: "#b95e34",
  },
  outlined: {
    blue: "#476cff",
    red: "#ef4444",
    black: "#000000",
    brand: "#b95e34",
  },
  text: {
    blue: "#476cff",
    red: "#ef4444",
    black: "#000000",
    brand: "#b95e34",
  },
  icon: {
    blue: "#476cff",
    red: "#ef4444",
    black: "#000000",
    brand: "#b95e34",
  },
};

const LOADING_SIZE_MAP: Record<Size, string> = {
  lg: "w-[24px] h-[24px]",
  md: "w-[22px] h-[22px]",
  sm: "w-[20px] h-[20px]",
  icon: "w-[20px] h-[20px]",
};

Button.displayName = "Button";

export const buttonVariants = ({
  variant = "solid",
  color = "blue",
  size = "lg",
  shape = "default",
  shadow = "none",
  disabled = false,
}: {
  variant?: Variant;
  color?: Color;
  size?: Size;
  shape?: Shape;
  shadow?: Shadow;
  disabled?: boolean;
}): string => {
  return cn(
    "inline-flex items-center justify-center",
    "text-nowrap",
    BUTTON_VARIANT_MAP[variant][color],
    variant !== "text" && BUTTON_SIZE_MAP[shape][size], // text variant일 때는 size map 제외
    BUTTON_TEXT_SIZE_MAP[size],
    BUTTON_SHAPE_MAP[shape],
    BUTTON_SHADOW_MAP[shadow],
    disabled && BUTTON_DISABLED_MAP[variant],
  );
};

export { Button };
export type {
  Variant as ButtonVariant,
  Color as ButtonColor,
  Size as ButtonSize,
  Shape as ButtonShape,
  Shadow as ButtonShadow,
};
export default Button;
