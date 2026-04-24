import { useEffect, useState } from "react";
import { ROUTES } from "@/router/routes";
import { Button, TextField } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adminLogo } from "@/config/images";
import { parseMenuAuthList } from "@/interfaces/menuAuthInterface";
import jwtAxios from "@/api/axiosJwt";
import type { AppDispatch } from "@/store/index";
import { SESSION_CM_AUTH_KEY, loadSession } from "@/store/sessionSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [employeeIdError, setEmployeeIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    document.title = "KIDS 관리자 | 로그인";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmployeeIdError("");
    setPasswordError("");

    let hasError = false;

    if (!employeeId.trim()) {
      setEmployeeIdError("사번을 입력해 주세요.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해 주세요.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      // Node(JWT) 관리자 로그인 API
      const response = await jwtAxios.post(`/api/pp/adminLogin`, {
        empNo: employeeId,
        password: password,
      });

      const userInfo = response.data;
      const accessToken = userInfo?.accessToken as string | undefined;
      if (accessToken) {
        sessionStorage.setItem(SESSION_CM_AUTH_KEY, JSON.stringify({ acsTokenCn: accessToken, tokenSn: 1000 }));
      }

      const empNoVal = String(userInfo?.empNo ?? employeeId);
      const empNmVal = String(userInfo?.empNm ?? "");
      dispatch(
        loadSession({
          userType: "A",
          userNo: empNoVal,
          userName: empNmVal || empNoVal,
          empNo: empNoVal,
          empNm: empNmVal,
          loginTime: Date.now(),
          menuAuthList: parseMenuAuthList(userInfo?.menuAuthList),
        })
      );

      navigate(ROUTES.CM.AD.DASHBOARD);
    } catch {
      setEmployeeIdError("사번 또는 비밀번호를 확인해 주세요.");
    }
  };

  return (
    <div className="login_wrap">
      <div className="inner">
        <div className="desc">
          <h1 className="logo">
            <a href="javascript:void(0);">
              <img src={adminLogo} alt="한국의약품안전관리원" />
              <span className="logo_text">관리자 로그인</span>
            </a>
          </h1>
          <p className="txt">한국의약품안전관리원 관리자 포털 로그인 페이지입니다.</p>
          <p className="txt">로그인 후 서비스를 이용하실 수 있습니다.</p>
        </div>
        <form className="login_form" onSubmit={handleSubmit}>
          <div className="field_group">
            <div className="label_field">
              <span className="label">사번</span>
              <div className="field_input">
                <TextField
                  fullWidth
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  error={!!employeeIdError}
                  helperText={employeeIdError}
                  placeholder="사번을 입력하세요"
                  autoComplete="username"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "50px",
                      fontSize: "15px",
                      "& fieldset": {
                        borderColor: employeeIdError ? "#d32f2f" : "#e2e8f0",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      marginTop: "6px",
                      fontSize: "13px",
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <div className="field_group">
            <div className="label_field">
              <span className="label">비밀번호</span>
              <div className="field_input">
                <TextField
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!passwordError}
                  helperText={passwordError}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "50px",
                      fontSize: "15px",
                      "& fieldset": {
                        borderColor: passwordError ? "#d32f2f" : "#e2e8f0",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      marginTop: "6px",
                      fontSize: "13px",
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="btn_default btn_login"
            sx={{
              height: "55px",
              fontSize: "20px",
              fontWeight: 600,
              backgroundColor: "#087c80",
              "&:hover": {
                backgroundColor: "#065f62",
              },
            }}
          >
            로그인
          </Button>
        </form>
        <div className="login_util">
          <ul>
            <li>
              <Button
                type="button"
                onClick={() => {
                  alert("비밀번호 발급 기능은 준비 중입니다.");
                }}
                sx={{
                  background: "none",
                  border: "none",
                  padding: "5px 15px",
                  fontSize: "14px",
                  color: "var(--color_02)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderRadius: "4px",
                  textTransform: "none",
                  "&:hover": {
                    background: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                비밀번호 발급
              </Button>
            </li>
          </ul>
        </div>
        <div className="login_notice">
          <ul>
            <li>
              최초 로그인 시 <strong>"비밀번호 발급"</strong> 메뉴에서 임시 비밀번호를 발급받으세요.
            </li>
            <li>
              비밀번호 <strong>5회 오류 시</strong> 임시 비밀번호를 발급받으세요.
            </li>
            <li>임시 비밀번호로 로그인 후 비밀번호를 변경하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
