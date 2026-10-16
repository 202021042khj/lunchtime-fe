"use client";

import { cssTransition, ToastContainer } from "react-toastify";

const NotifyContainer = () => {
  return (
    <ToastContainer
      position="top-center"
      // 한 줄 안내를 읽을 시간 (되돌리기처럼 버튼이 있는 토스트는 호출하는 쪽에서 더 길게)
      autoClose={2500}
      closeOnClick={true}
      closeButton={false}
      hideProgressBar={true}
      transition={cssTransition({
        enter: "fade-in",
        exit: "fade-out",
        appendPosition: false,
        collapse: false,
      })}
      pauseOnFocusLoss={false}
      limit={1}
    />
  );
};

export default NotifyContainer;
