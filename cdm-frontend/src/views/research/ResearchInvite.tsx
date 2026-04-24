import { STRINGS } from "@/constants/string";

export default function ResearchDetailView() {
  // const irbViewModal = useModal(ModalNames.IrbView);
  // const cancelInviteModal = useModal(ModalNames.CancelInvite);

  const analyticalFileRows = Array.from({ length: 3 });

  return (
    <div className="">
      <div className="flex justify-between pt-2">
        <div>
          <h5 className="text-2xl text-gray-800 font-semibold">의약품 대사 경로 분석을 통한 부작용 최소화 전략</h5>
          <p className="text-gray-800">과제ID: 2026-A254812-001</p>
        </div>
        <div>
          <button className="px-5 py-2 bg-blue-500 text-white">수정</button>
          <button className="ml-2 px-5 py-2 bg-gray-300 rounded">목록</button>
        </div>
      </div>

      <div className="h-15"></div>
      {/* 과제 내용 */}
      <h5 className="h-12 text-xl text-gray-800 font-semibold">과제 내용</h5>
      <div className="">
        {/* 과제 내용 1 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>등록기관</span>
            </div>
            <div className="flex items-center w-full px-3">울산대학병원</div>
          </div>
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>{STRINGS.REGISTERED_BY}</span>
            </div>
            <div className="flex items-center w-full px-3">이아름</div>
          </div>
        </div>

        {/* 과제 내용 2 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>{STRINGS.REGISTERED_AT}</span>
            </div>
            <div className="flex items-center w-full px-3">2026.06.03 15:23</div>
          </div>
        </div>

        {/* 과제 내용 3 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>{STRINGS.STATUS}</span>
            </div>
            <div className="flex items-center w-full px-3">
              <span className="px-2.5 py-0.5 rounded-md border border-lime-600 text-lime-600">{STRINGS.REQUEST_INVITE}</span>
            </div>
          </div>
        </div>

        {/* 과제 내용 4 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>
                과제내용
                {/* <span className="px-1 text-red-500">*</span> */}
              </span>
            </div>
            <div className="flex items-center w-full p-3">
              <div className="whitespace-pre-line">
                {`본 연구는 특정 질환 치료를 위해 30일 이상 동일한 표적 약물(target drug)을 처방받은 환자를 대상으로 합니다. 
                약물 복용의 효과 및 부작용 발생 여부를 분석하여 향후 안전하고 효과적인 치료 가이드를 마련하고자 합니다.
                
                고혈압 치료제로 널리 사용되는 Amlovar는 칼슘 통로 차단제 계열에 속하며, 혈관 확장을 통해 혈압을 낮추는 작용을 한다. 
                시판 초기에는 비교적 안전한 약물로 평가되었으나, 장기 복용 환자 증가에 따라 다양한 형태의 부작용 보고가 꾸준히 축적되고 있다.
                
                연구 대상자는 2019년부터 2024년까지 해당 약물을 30일 이상 복용한 성인을 포함하였다. 
                분석 결과 가장 흔한 부작용은 말초 부종으로, 특히 발목과 발등에 부종이 집중되는 경향이 확인되었다. 이러한 부종은 용량 의존적 특성을 보여 고용량에서 발생률이 증가하였다.
                `}
              </div>
            </div>
          </div>
        </div>

        {/* 과제 내용 5 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>수행기간</span>
            </div>
            <div className="flex items-center w-full px-3">
              <span className="mr-1">2026.06.21</span>
              <span className="px-2">-</span>
              <span className="mr-1">2026.10.29</span>
            </div>
          </div>
        </div>

        {/* 과제 내용 6 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>분석질의</span>
            </div>
            <div className="w-full p-3">
              {/* 파일 리스트 */}
              <ul>
                {analyticalFileRows.map((_, index) => (
                  <li className="flex justify-between px-3 py-3 mb-1.5 rounded-md border border-gray-400" key={index}>
                    <div className="flex items-center">
                      <a>{index}. 분석질의에 필요한 분석코드</a>
                      <span className="ml-2 px-1">[PDF, 152.KB]</span>
                    </div>
                    {/* <div className="flex items-center">
                      <button className="bg-zinc-100 border border-zinc-300 hover:border-zinc-400">
                        <img
                          src={Images.InterfaceIcons["Close"]}
                          alt="close"
                          className="w-7.5 h-7.5 p-[0.22rem]"
                        />
                      </button>
                    </div> */}
                  </li>
                ))}
              </ul>
              <div className="h-5"></div>
            </div>
          </div>
        </div>

        {/* 과제 내용 7 */}
        <div className="flex w-full bg-white border-t border-slate-300">
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>분석 DATASET 관리</span>
            </div>
            <div className="flex items-center w-full px-3">
              <button className="px-3 py-1.5 rounded-md bg-blue-500 text-white">분석 DATASET 관리</button>
            </div>
          </div>
          <div className="flex w-full h-12">
            <div className="flex items-center w-full h-full min-w-[12rem] max-w-[12rem] px-3 bg-gray-200">
              <span>분석 데이터 승인 상태</span>
            </div>
            <div className="flex items-center w-full px-3">
              <span className="px-2.5 py-0.5 rounded-md border border-lime-600 text-lime-600">검토요청</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-5"></div>

      {/* 하단 버튼 */}
      <div className="flex justify-between w-full">
        <div></div>
        <div>
          <button className="px-5 py-2 bg-blue-500 text-white">과제 수행</button>
        </div>
      </div>

      <div className="h-15"></div>

      {/* 리스트 영역 */}
      {/* <div>
        <div className="flex justify-between">
          <div>
            <h5 className="h-12 text-xl text-gray-800 font-semibold">참여기관</h5>

            <div className="mb-1">
              총
              <span className="pl-1 font-semibold text-blue-500">
                {memberRows.length} 참여기관
              </span>
              이 등록되었습니다.
            </div>
          </div>
          <div className="flex items-end py-2"></div>
        </div>
        <table className="w-full table-fixed1 border-collapse">
          <thead>
            <tr className="h-11 bg-gray-200 border-y border-zinc-300">
              <th className="w-[6rem] min-w-[6rem] px-3 1bg-green-200">상태</th>
              <th className="min-w-[15rem] max-w-[20rem] px-2 text-left 1bg-red-100">
                기관명
              </th>
              <th className="w-[9rem] min-w-[9rem] px-2 text-left 1bg-blue-100">
                연락처
              </th>
              <th className="w-[10rem] min-w-[10rem] px-2 1bg-yellow-100">
                데이터 업로드 상태
              </th>
              <th className="w-[8rem] min-w-[8rem] px-2 1bg-blue-200">IRB/DRB</th>
              <th className="w-[7rem] min-w-[7rem] px-2 1bg-green-200">참여취소</th>
              <th className="w-[10rem] min-w-[10rem] px-2 1bg-red-100">참여취소 일시</th>
              <th className="w-full min-w-[15rem] max-w-[15rem] px-2 text-left font-normal1">
                참여취소 사유
              </th>
            </tr>
          </thead>

          <tbody className="max-h-[10rem] overflow-y-auto">
            {memberRows.map((member, index) => (
              <tr key={index} className="h-15 bg-white border-b border-zinc-200">
                <td className="px-3 text-center">
                  <span
                    className={`inline-block w-[4rem] ${
                      (getStatusConfig(member.progressStatus) as { className?: string })?.className ?? ""
                    }`}
                  >
                    {getStatusConfig(member.progressStatus)?.label}
                  </span>
                </td>
                <td className="px-3">{member.name}</td>
                <td className="px-2">{member.phoneNumber}</td>
                <td className="px-3 text-center">{member.cdmStatus}</td>
                <td className="px-3 text-center">
                  {member.irbStatus && (
                    <button
                      className="px-3 py-1.5 rounded-md bg-blue-500 text-white"
                      onClick={() => {
                        irbViewModal.open({
                          title: "IRB/DRB",
                          showHeaderCloseButton: true,
                          data: {
                            name: member.name,
                          },
                        });
                      }}
                    >
                      등록완료
                    </button>
                  )}
                  {!member.irbStatus && (
                    <button className="px-3 py-1.5 rounded-md bg-gray-400 text-white">
                      미등록
                    </button>
                  )}
                </td>
                <td className="px-3 text-center">
                  {!member.isCancel && (
                    <button
                      className="px-3 py-1.5 rounded-md bg-red-500 text-white"
                      onClick={() => {
                        cancelInviteModal.open({
                          title: "참여취소",
                          data: { name: member.name },
                        });
                      }}
                    >
                      취소
                    </button>
                  )}
                </td>
                <td className="px-3 text-center">{member.cancelDate}</td>
                <td className="px-3">{member.cancelDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}
    </div>
  );
}
