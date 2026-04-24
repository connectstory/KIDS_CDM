import React from "react";

const SkipNavigation: React.FC = () => {
  // 스킵 네비게이션 핸들러
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    const target = document.getElementById(targetId);

    if (target) {
      // 1. 강제로 포커스를 받을 수 있는 상태로 만듭니다. (핵심)
      target.setAttribute("tabindex", "-1");

      // 2. 포커스를 이동시킵니다.
      target.focus();

      // 3. 사용자가 해당 영역을 벗어나면 tabindex 속성을 제거하여 DOM을 깨끗하게 유지합니다.
      target.addEventListener(
        "blur",
        () => {
          target.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
  };

  return (
    <nav id="skip-navigation">
      <ul>
        <li>
          <a href="#content" onClick={(e) => handleSkip(e, "content")}>
            본문 바로가기
          </a>
        </li>
      </ul>
    </nav>
  );
};
export default SkipNavigation;
