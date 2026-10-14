import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  ReactElement,
  Ref,
  HTMLAttributes,
  ReactNode,
  Fragment,
  RefObject,
} from "react";

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, ref) => {
    const childrenArray = getChildrenArray(children);

    const slottable = childrenArray.find(isSlottable);

    if (slottable) {
      const newElement = slottable.props.children;

      const newChildren = childrenArray.map((child) => {
        if (child !== slottable) {
          return child;
        }

        if (isValidElement(newElement)) {
          return (newElement.props as { children: ReactNode }).children;
        }

        return null;
      });

      return isValidElement(newElement)
        ? cloneElement(
            newElement as SlotElement,

            {
              ...mergeProps(slotProps as AnyProps, newElement.props as AnyProps),

              ref: ref ? composeRefs(ref, getElementRef(newElement)) : getElementRef(newElement),
            },

            newChildren,
          )
        : null;
    }

    if (isValidElement(children)) {
      return cloneElement(children as SlotElement, {
        ...mergeProps(slotProps as AnyProps, children.props as AnyProps),

        ref: ref ? composeRefs(ref, getElementRef(children)) : getElementRef(children),
      });
    }

    return null;
  },
);

Slot.displayName = "Slot";

export interface SlottableProps {
  children: ReactNode;
}

export const Slottable = ({ children }: SlottableProps) => {
  return <>{children}</>;
};

export type AsChildProps<T> = T & {
  asChild?: boolean;
};

function getChildrenArray(children: ReactNode) {
  const childrenArray = Children.toArray(children);

  if (childrenArray.length === 1 && isFragment(childrenArray[0])) {
    return Children.toArray(
      (childrenArray[0].props as { children: ReactNode }).children,
    );
  }

  return childrenArray;
}

function isSlottable(child: ReactNode): child is ReactElement<SlottableProps> {
  return isValidElement(child) && child.type === Slottable;
}

function isFragment(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.type === Fragment;
}

type PossibleRef<T> = Ref<T> | undefined;

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== undefined && ref !== null) {
    (ref as RefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T) => refs.forEach((ref) => setRef(ref, node));
}

type AnyProps = Record<string, unknown>;
type Handler = (...args: unknown[]) => void;
type SlotElement = ReactElement<AnyProps & { ref?: Ref<HTMLElement> }>;

// React 19에서는 ref가 element.ref가 아니라 props.ref에 있다
function getElementRef(element: ReactElement): PossibleRef<HTMLElement> {
  return (element.props as { ref?: Ref<HTMLElement> }).ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps) {
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];

    const childPropValue = childProps[propName];

    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          (childPropValue as Handler)(...args);

          (slotPropValue as Handler)(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    }

    if (propName === "style") {
      overrideProps[propName] = { ...(slotPropValue as object), ...(childPropValue as object) };
    }

    if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue]

        .filter(Boolean)

        .join(" ");
    }
  }

  return { ...slotProps, ...overrideProps };
}

export default Slot;
