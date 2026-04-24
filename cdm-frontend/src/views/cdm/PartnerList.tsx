import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";

export default function PartnerListManagerPopup() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AddPartners]);

  const [leftData, setLeftData] = useState([
    "가톨릭 대전 성모병원",
    "가톨릭 부산 성모병원",
    "가톨릭 은평 성모병원",
    "가톨릭 익산 성모병원",
    "가톨릭 서울 성모병원",
  ]);
  const [rightData, setRightData] = useState(["강원대병원", "부산대병원", "서울대병원", "가톨릭 서울 성모병원"]);

  const moveOneRight = (item: string) => {
    setLeftData((prev) => prev.filter((x) => x !== item));
    setRightData((prev) => [...prev, item]);
  };

  const moveOneLeft = (item: string) => {
    setRightData((prev) => prev.filter((x) => x !== item));
    setLeftData((prev) => [...prev, item]);
  };

  const moveAllRight = () => {
    setRightData((prev) => [...prev, ...leftData]);
    setLeftData([]);
  };

  const moveAllLeft = () => {
    setLeftData((prev) => [...prev, ...rightData]);
    setRightData([]);
  };

  useEffect(() => {
    document.title = "기관 정보 조회";
  }, []);

  if (!modal?.open) return null;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.AddPartners, result);
    dispatch(closeModal(ModalNames.AddPartners));
  };

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} showHeader={false}>
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      <div className="p-2">
        <h2 className="text-xl font-bold mb-4">기관 정보 조회</h2>

        <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
          {/* 전체 기관 */}
          <div
            className="panel"
            style={{
              width: "45%",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "10px",
              height: "400px",
              overflowY: "auto",
            }}
          >
            <div className="panel-title" style={{ fontWeight: "bold", marginBottom: "10px" }}>
              전체 기관
            </div>
            <div>
              {leftData.map((item, idx) => (
                <div
                  key={idx}
                  className="item"
                  onClick={() => moveOneRight(item)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item} <span>▶</span>
                </div>
              ))}
            </div>
          </div>

          {/* 가운데 버튼 */}
          <div
            className="middle-buttons"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <button
              onClick={moveAllRight}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0a74ff",
                border: "none",
                color: "white",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              &raquo;
            </button>
            <button
              onClick={moveAllLeft}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0a74ff",
                border: "none",
                color: "white",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              &laquo;
            </button>
          </div>

          {/* 참여 기관 */}
          <div
            className="panel"
            style={{
              width: "45%",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "10px",
              height: "400px",
              overflowY: "auto",
            }}
          >
            <div className="panel-title" style={{ fontWeight: "bold", marginBottom: "10px" }}>
              참여 기관
            </div>
            <div>
              {rightData.map((item, idx) => (
                <div
                  key={idx}
                  className="item"
                  onClick={() => moveOneLeft(item)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item} <span>◀</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer" style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            className="btn-close"
            onClick={() => handleClose(false)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              marginLeft: "10px",
              background: "#ccc",
            }}
          >
            닫기
          </button>
          <button
            className="btn-save"
            onClick={() => handleClose(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              marginLeft: "10px",
              background: "#b86136",
              color: "white",
            }}
          >
            등록
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
