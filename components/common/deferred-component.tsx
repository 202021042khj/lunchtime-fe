"use client";

import { ReactNode, useEffect, useState } from "react";

interface DeferredComponentProps {
  delay?: number;
  children: ReactNode;
}

const DeferredComponent = ({
  delay = 200,
  children,
}: DeferredComponentProps) => {
  const [isDeferred, setIsDeferred] = useState(false);

  useEffect(() => {
    // delay 0이면 타이머 없이 바로 보여 준다 (아래 렌더 조건에서 처리)
    if (delay === 0) return;

    const timeoutId = setTimeout(() => {
      setIsDeferred(true);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);

  if (delay !== 0 && !isDeferred) {
    return null;
  }

  return <>{children}</>;
};

export default DeferredComponent;
