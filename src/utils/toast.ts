import { Id, Slide, toast, TypeOptions } from "react-toastify";

export const showErrorNotify = (msg: string) =>
  toast.error(msg, {
    position: "bottom-right",
    closeOnClick: true,
    closeButton: true,
    autoClose: 4000,
    hideProgressBar: false,
  });

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
