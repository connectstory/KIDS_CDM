/**
 * 날짜 형식 변환 유틸리티
 * 백엔드: YYYYMMDD (CHAR(8))
 * 프론트엔드: YYYY-MM-DD (표시용)
 */
import dayjs from "dayjs";

/**
 * Date 객체 또는 YYYY-MM-DD 형식 문자열을 YYYYMMDD 형식으로 변환
 * @param date Date 객체 또는 "YYYY-MM-DD" 형식 문자열
 * @returns "YYYYMMDD" 형식 문자열
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  let dateObj: Date;

  if (typeof date === "string") {
    // YYYY-MM-DD 형식인지 확인
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + "T00:00:00");
    } else if (date.match(/^\d{8}$/)) {
      // 이미 YYYYMMDD 형식이면 그대로 반환
      return date;
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date");
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * YYYYMMDD 형식 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateStr "YYYYMMDD" 형식 문자열
 * @returns "YYYY-MM-DD" 형식 문자열
 */
export function formatDateFromYYYYMMDD(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  // YYYYMMDD 형식인지 확인
  if (!dateStr.match(/^\d{8}$/)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYYMMDD format.`);
  }

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * YYYYMMDD 형식 문자열을 Date 객체로 변환
 * @param dateStr "YYYYMMDD" 형식 문자열
 * @returns Date 객체
 */
export function parseYYYYMMDD(dateStr: string | null | undefined): Date {
  if (!dateStr) {
    throw new Error("Date string is required");
  }

  // 이미 YYYY-MM-DD 형식이면 Date 객체로 변환
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr + "T00:00:00");
  }

  // YYYYMMDD 형식인지 확인
  if (!dateStr.match(/^\d{8}$/)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYYMMDD format.`);
  }

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // 월은 0부터 시작
  const day = parseInt(dateStr.substring(6, 8), 10);

  return new Date(year, month, day);
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환
 * @returns "YYYYMMDD" 형식 문자열
 */
export function getTodayYYYYMMDD(): string {
  return formatDateToYYYYMMDD(new Date());
}

/**
 * 날짜 범위 유효성 검증 (시작일 ≤ 종료일)
 * @param startDate 시작일 (YYYYMMDD 또는 YYYY-MM-DD)
 * @param endDate 종료일 (YYYYMMDD 또는 YYYY-MM-DD)
 * @returns 유효하면 true, 아니면 false
 */
export function validateDateRange(startDate: string | null | undefined, endDate: string | null | undefined): boolean {
  if (!startDate || !endDate) return true; // 둘 중 하나라도 없으면 검증 통과

  try {
    const start = parseYYYYMMDD(startDate);
    const end = parseYYYYMMDD(endDate);
    return start <= end;
  } catch {
    return false;
  }
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "-";

  return dayjs(date).format("YYYY년 MM월 DD일");
}

export function formatDateComma(date: string | null | undefined): string {
  if (!date) return "-";

  return dayjs(date).format("YYYY.MM.DD");
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "-";

  return dayjs(date).format("YYYY년 MM월 DD일 HH:mm");
}

export function formatDateTimeComma(date: string | null | undefined): string {
  if (!date) return "-";

  return dayjs(date).format("YYYY.MM.DD HH:mm");
}

export function formatDateTime2Line(date: string | null | undefined): string {
  if (!date) return "-";

  return dayjs(date).format("YYYY.MM.DD HH:mm");
}
