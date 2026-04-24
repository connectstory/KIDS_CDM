import { useEffect } from "react";
import { ROUTES } from "@/router/routes";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "KIDS 관리자 | 페이지를 찾을 수 없습니다";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4" style={{ minHeight: "100vh" }}>
      <div className="error_page">
        <div className="error_code">
          <i className="icon"></i>
          <div className="desc">
            <p className="txt_01">404</p>
            <p className="txt_02">Not Found</p>
          </div>
        </div>
        <div className="error_msg">
          <p className="txt_01">원하시는 페이지를 찾을 수 없습니다.</p>
          <p>존재하지 않는 주소를 입력하셨거나, 요청하신 페이지의 주소가 변경, 삭제되어 찾을 수 없습니다.</p>
          <p>문제가 계속될 경우에는 관리자에게 문의하시기 바랍니다.</p>
        </div>
        <div className="btn_area">
          <Button variant="outlined" onClick={() => window.history.back()}>
            이전 화면으로
          </Button>
          <Button variant="contained" onClick={() => navigate(ROUTES.ROOT)}>
            메인 화면으로
          </Button>
        </div>
      </div>
      {/* <div className="text-center max-w-md">
        <div className="flex flex-col items-center gap-4 mb-8">
          <ErrorOutline
            sx={{ fontSize: 80, color: "text.secondary" }}
            className="opacity-70"
          />
          <div>
            <Typography variant="h1" fontWeight={700} color="text.secondary">
              404
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Not Found
            </Typography>
          </div>
        </div>

        <div className="text-left mb-8 space-y-2">
          <Typography variant="body1" fontWeight={600} color="text.primary">
            원하시는 페이지를 찾을 수 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            존재하지 않는 주소를 입력하셨거나, 요청하신 페이지의 주소가 변경,
            삭제되어 찾을 수 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            문제가 계속될 경우에는 관리자에게 문의하시기 바랍니다.
          </Typography>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            size="large"
          >
            이전 화면으로
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(ROUTES.CM.AD.DASHBOARD)}
            size="large"
          >
            메인 화면으로
          </Button>
        </div>
      </div> */}
    </div>
  );
}
