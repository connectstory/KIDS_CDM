package kr.or.kids.domain.cm.common.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
  public static final String STATUS_SUCCESS = "success";
  public static final String STATUS_NOT_FOUND = "not_found";
  public static final String STATUS_FAIL = "fail";
  public static final String STATUS_ERROR = "error";

  private static final String DEFAULT_SUCCESS_MESSAGE = "요청이 성공적으로 처리되었습니다.";

  private String status;
  private String message;
  private T data;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Integer page;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Integer length;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Integer total;

  public static <T> ResponseEntity<ApiResponse<T>> ok( T data ) {
    return ok( STATUS_SUCCESS, DEFAULT_SUCCESS_MESSAGE, data );
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok( String status, String message, T data ) {
    return ResponseEntity.ok( ApiResponse.<T> builder().status( status ).message( message ).data( data ).build() );
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok( String status, String message, T data, Integer page, Integer length, Integer total ) {
    return ResponseEntity.ok( ApiResponse.<T> builder().status( status ).message( message ).data( data ).page( page ).length( length ).total( total ).build() );
  }

  public static <T> ResponseEntity<ApiResponse<T>> error( HttpStatus status, String message ) {
    return ResponseEntity.status( status ).body( ApiResponse.<T> builder().status( STATUS_ERROR ).message( message ).build() );
  }

  public static <T> ResponseEntity<ApiResponse<T>> error( HttpStatus status, String message, T data ) {
    return ResponseEntity.status( status ).body( ApiResponse.<T> builder().status( STATUS_ERROR ).message( message ).data( data ).build() );
  }
}
