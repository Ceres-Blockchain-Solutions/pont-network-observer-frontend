import { Id, Slide, toast, TypeOptions } from "react-toastify";

export const showLoadingNotify = () =>
  toast.info("Transaction in progress...", {
    position: "bottom-right",
    closeOnClick: false,
    closeButton: false,
    autoClose: false,
    hideProgressBar: true,
  });

export const updateNotify = (
  toastId: Id,
  msg: string,
  type: TypeOptions,
  onClick?: () => void
) =>
  toast.update(toastId, {
    render: msg,
    type: type,
    position: "bottom-right",
    closeOnClick: true,
    closeButton: true,
    autoClose: 6000,
    transition: Slide,
    hideProgressBar: true,
    onClick,
  });
