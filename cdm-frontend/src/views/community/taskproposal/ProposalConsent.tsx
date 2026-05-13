import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { Helmet } from "react-helmet";

export default function ProposalConsentView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 과제제안</title>
      </Helmet>
      {/* 헤더 설명 */}
      <p className="text-base mb-4 mt-2">
        데이터 분석을 통한 의약품 안전성 연구가 필요하다고 생각되는 주제를 제안해주세요.
      </p>

      {/* 개인정보 안내 타이틀 */}
      <h4 className="text-lg font-semibold mb-4">개인정보 수집 및 이용 안내</h4>

      {/* 본문 박스 */}
      <div className="border rounded bg-white p-6 text-gray-700 text-base leading-relaxed">
        <p className="font-semibold mb-2">
          병원자료 분석네트워크 과제제안 ‘개인정보 수집 동의 및 이용안내’
        </p>

        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <span className="font-semibold">
              개인정보의 수집·이용 목적 (개인정보보호법 제 15조)
            </span>
            <br />
            한국의약품안전관리원은 병원자료 분석네트워크의 과제제안 관련 업무를 수행하기
            위하여 다음과 같이 개인정보를 수집, 이용합니다. 수집된 개인정보는 정해진 목적
            이외의 용도로는 사용되지 않으며, 수집 목적이 변경될 경우 사전에 정보
            제공자에게 알리고 다시 동의를 받을 예정입니다.
            <br />- 병원자료 분석네트워크 과제제안 관련 접수·처리·사후관리 서비스 제공
          </li>

          <li>
            <span className="font-semibold">
              수집하는 개인정보의 항목 (개인정보보호법 제 15조, 제 16조)
            </span>
            <br />- 수집항목: (필수항목) 성명, 이메일, 비밀번호, 질문내용
          </li>

          <li>
            <span className="font-semibold">개인정보의 보유 및 이용기간 :</span>{" "}
            <span className="text-blue-600 font-bold">3년</span>
          </li>

          <li>
            <span className="font-semibold">개인정보처리의 취급위탁 :</span> 해당사항 없음
          </li>

          <li>
            <span className="font-semibold">동의 거부권리 안내 :</span> 신청인은 본
            개인정보 수집에 대한 동의를 거부할 권리가 있으며, 이 경우 병원자료
            분석네트워크 과제제안 서비스 이용이 제한될 수 있습니다.
          </li>
        </ol>

        {/* 체크박스 */}
        <div className="flex justify-end mt-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            {/* 실제 checkbox (접근성용, 숨김) */}
            <input
              type="checkbox"
              id="agree"
              className="sr-only peer"
            />

            {/* 커스텀 박스 */}
            <span
              className="
                w-4 h-4
                border border-gray-400
                rounded-sm
                flex items-center justify-center
                peer-checked:bg-blue-600
                peer-checked:border-blue-600
              "
            >
              <svg
                className="hidden peer-checked:block w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>

            <span className="">
              개인정보 수집 및 이용 안내에 동의합니다.
            </span>
          </label>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="w-full flex justify-center mt-6 mb-6">
        <Button 
          variant="contained" 
          onClick={() => navigate(`${routes.COMMUNITY.ROOT}/proposal/write`)}
        >
          다음
        </Button>
      </div>

      {/* 하단 경고 박스 */}
      <div className="mt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-gray-700 flex items-start space-x-3">
        <div className="text-amber-500 text-xl">⚠️</div>
        <p className="leading-relaxed text-base">
          개인정보 유출, 타인에 대한 비방과 허위 사실 적시, 욕설 등의 게시물은
          「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 의거 처벌을 받을 수 있으며
          관리자에 의해 비공개로 전환될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
