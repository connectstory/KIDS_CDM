import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MSG } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";

interface AnalysisResultModalData {
  title: string;
}

export default function AnalysisResultModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AnalysisResultUpload]);

  const uploadAnalyticalRef = useRef<HTMLInputElement>(null);

  if (!modal?.open) return null;

  const modalData = modal.data as AnalysisResultModalData | undefined;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.AnalysisResultUpload, result);
    dispatch(closeModal(ModalNames.AnalysisResultUpload));
  };

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title={modal.title}>
      {/* 메시지 출력 */}
      <div className="h-2"></div>

      <div className="pb-5">
        <h5 className="text-xl font-semibold">{modalData && modalData.title}</h5>
      </div>

      <div className="w-full border-y border-gray-300">
        <div className="flex w-full border-b border-gray-300">
          <div className="flex flex-col justify-center w-full min-w-[10rem] max-w-[10rem] px-3 py-2 bg-gray-200 text-left">
            <p className="w-full font-semibold">
              분석결과 자료<span className="px-1 text-red-500">*</span>
            </p>
          </div>
          <div className="flex items-center w-full pl-3 py-2">
            {/* 파일 리스트 */}
            <div className="w-full bg-white rounded-lg p-3 border border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <input ref={uploadAnalyticalRef} className="hidden" type="file" multiple name="uploadAnalytical"></input>
              <div
                className="text-center"
                onClick={() => {
                  uploadAnalyticalRef.current?.click();
                }}
              >
                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-600">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-xs text-gray-500">PNG, JPG, PDF (최대 10MB)</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full">
          <div className="flex flex-col justify-center w-full min-w-[10rem] max-w-[10rem] px-3 py-2 bg-gray-200 text-left">
            <p className="w-full font-semibold">
              결과 설명<span className="px-1 text-red-500">*</span>
            </p>
          </div>
          <div className="flex items-center w-full pl-3 py-2">
            <textarea
              className="w-full h-[6rem]"
              placeholder={MSG.COMMENT_CONTENT_REQUIRED}
              // value={condition}
              // onChange={(e) => setCondition(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>

      <div className="h-10"></div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => handleClose(false)}>
          취소
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleClose(true)}>
          확인
        </button>
      </div>
    </BaseModal>
  );
}
