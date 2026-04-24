package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 공유파일 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SharedFileResponse {
  private Long fileUldSn; // 파일업로드일련번호
  private Long pstSn; // 게시물일련번호
  private Long atchFileSn; // 첨부파일일련번호
  private String fileSeCd; // 파일구분코드
  private Long ptcpInstSn; // 참여기관일련번호
  private String fileName; // 파일명
  private Long fileSize; // 파일크기
  private String fileExt; // 파일확장자
  private String rgtrId; // 등록자아이디
  private String rgtrNm; // 등록자명
  private LocalDateTime regDt; // 등록일시
}
