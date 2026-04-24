package kr.or.kids.domain.cm.common.utils;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  // IOException 처리 (파일 읽기·쓰기·미리보기 실패)
  @ExceptionHandler(IOException.class)
  public ResponseEntity<ApiResponse<Void>> handleIOException(IOException e) {
    logger.error("IO Error: {}", e.getClass().getSimpleName());
    return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 처리 중 오류가 발생했습니다." );
  }

  /**
   * [보안] DB 관련 예외 처리
   * SQL 구문이나 DB 정보가 노출되지 않도록 명시적으로 분리하여 처리합니다.
   */
  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ApiResponse<Void>> handleDataAccessException(DataAccessException e) {
    // 로그에는 에러 타입과 메시지만 기록하여 보안성 강화
    logger.error("Database Error: {}", e.getClass().getSimpleName());
    return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "데이터 처리 중 오류가 발생했습니다." );
  }

  // IllegalArgumentException 처리 (잘못된 요청)
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
    logger.warn("Invalid Request: {}", e.getMessage());
    return ApiResponse.error( HttpStatus.BAD_REQUEST, "잘못된 요청입니다." );
  }

  // NullPointerException 처리
  @ExceptionHandler(NullPointerException.class)
  public ResponseEntity<ApiResponse<Void>> handleNullPointerException(NullPointerException e) {
    logger.error("NullPointer Exception occurred");
    return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "요청을 처리하는 중 값이 누락되었습니다." );
  }

  // RuntimeException 처리
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
    logger.error("Runtime Exception: {}", e.getClass().getSimpleName());
    return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다." );
  }

  // 모든 예외의 최상위 처리 (컨트롤러의 try-catch Exception을 대체)
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
    logger.error("Unhandled Exception: {}", e.getClass().getSimpleName());
    return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "시스템 오류가 발생했습니다." );
  }
}