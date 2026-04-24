package test;

import java.util.List;
import java.util.Optional;

/** 테스트용 서비스 클래스 간단한 데이터 처리 및 계산 기능을 제공 */
public class TestServiceEx01 {

  /**
   * 두 숫자의 합을 계산
   *
   * @param a 첫 번째 숫자
   * @param b 두 번째 숫자
   * @return 합계
   */
  public int add(int a, int b) {
    return a + b;
  }

  /**
   * 문자열을 대문자로 변환
   *
   * @param input 입력 문자열
   * @return 대문자 변환 결과
   */
  public String toUpperCase(String input) {
    if (input == null) {
      throw new IllegalArgumentException("Input cannot be null");
    }
    return input.toUpperCase();
  }

  /**
   * 리스트에서 특정 요소 찾기
   *
   * @param items 검색할 리스트
   * @param target 찾을 요소
   * @return 찾은 요소 (Optional)
   */
  public Optional<String> findItem(List<String> items, String target) {
    if (items == null || target == null) {
      return Optional.empty();
    }
    return items.stream().filter(item -> target.equals(item)).findFirst();
  }

  /**
   * 숫자 리스트의 평균 계산
   *
   * @param numbers 숫자 리스트
   * @return 평균값
   * @throws IllegalArgumentException 리스트가 비어있거나 null인 경우
   */
  public double calculateAverage(List<Integer> numbers) {
    if (numbers == null || numbers.isEmpty()) {
      throw new IllegalArgumentException("Number list cannot be null or empty");
    }
    return numbers.stream().mapToInt(Integer::intValue).average().orElse(0.0);
  }

  /**
   * 사용자 이름 검증
   *
   * @param username 사용자 이름
   * @return 유효한 경우 true
   */
  public boolean isValidUsername(String username) {
    if (username == null || username.trim().isEmpty()) {
      return false;
    }
    // 영문자와 숫자만 허용, 길이 3-20자
    return username.matches("^[a-zA-Z0-9]{3,20}$");
  }
}
