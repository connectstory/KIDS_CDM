import { useDispatch } from "react-redux";
import type { ModalNames } from "@/interfaces/modalInterface.ts";
import { openModal } from "@/store/modalSlice";
import { createModalPromise } from "@/utils/modalPromise";

type ModalOpenPayload = {
  title?: string;
  message?: string | string[] | readonly string[];
  showHeaderCloseButton?: boolean;
  width?: string;
  fullWidth?: boolean;
  data?: unknown;
};

export function useModal(modalKey: ModalNames) {
  const dispatch = useDispatch();

  const open = (payload?: ModalOpenPayload) => {
    const promise = createModalPromise(modalKey); // type별 promise 생성
    dispatch(
      openModal({
        key: modalKey,
        title: payload?.title,
        message: payload?.message,
        showHeaderCloseButton: payload?.showHeaderCloseButton,
        width: payload?.width,
        fullWidth: payload?.fullWidth,
        data: payload?.data,
      })
    );
    return promise; // confirm처럼 await 가능
  };

  return { open };
}
