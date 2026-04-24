package kr.or.kids.domain.cm.research.service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.research.dto.AnalysisDatasetCondition;
import kr.or.kids.domain.cm.research.dto.DomainConceptDto;
import lombok.extern.slf4j.Slf4j;

/**
 * 분석 데이터셋 엑셀 양식 파싱. 첫 시트: 분석 시작일자, 분석 종료일자, 분석 성별(concept_id) 첫 시트 이후(2번째 시트부터): domain(영문), concept_id
 */
@Slf4j
@Component
public class AnalysisDatasetExcelParser {

  private static final String SHEET1_HEADER_START = "분석 시작일자";
  private static final String SHEET1_HEADER_END = "분석 종료일자";
  private static final String SHEET1_HEADER_GENDER = "분석 성별";
  private static final String SHEET2_HEADER_DOMAIN = "DOMAIN_TYPE";
  private static final String SHEET2_HEADER_CONCEPT_ID = "CONCEPT_ID";

  /**
   * 엑셀 스트림에서 첫 시트 조건 + (2번째 시트부터) domain별 concept_id 목록 파싱.
   *
   * @param inputStream 엑셀 파일 스트림 (호출 후 닫지 않음)
   * @return 파싱 결과 (condition + domainConcepts)
   */
  public ParsedAnalysisDataset parse( InputStream inputStream ) {
    if (inputStream == null) {
      throw new IllegalArgumentException( "엑셀 입력 스트림이 없습니다." );
    }
    try (Workbook wb = WorkbookFactory.create( inputStream )) {
      if (wb.getNumberOfSheets() < 1) {
        throw new IllegalArgumentException( "엑셀에 시트가 없습니다." );
      }
      AnalysisDatasetCondition condition = parseSheet1( wb.getSheetAt( 0 ) );
      List<DomainConceptDto> domainConcepts = new ArrayList<>();
      for (int i = 1; i < wb.getNumberOfSheets(); i++) {
        domainConcepts.addAll( parseSheet2( wb.getSheetAt( i ) ) );
      }
      if (domainConcepts.isEmpty()) {
        throw new IllegalArgumentException( "분석 데이터 양식과 다른 형식입니다, 확인해주세요" );
      }
      return new ParsedAnalysisDataset( condition, domainConcepts );
    } catch (IllegalArgumentException e) {
      throw e;
    } catch (Exception e) {
      log.warn( "분석 데이터셋 엑셀 파싱 실패", e );
      throw new IllegalArgumentException( "엑셀 파일을 읽을 수 없습니다. 올바른 양식인지 확인해 주세요." );
    }
  }

  private AnalysisDatasetCondition parseSheet1( Sheet sheet ) {
    if (sheet == null) {
      throw new IllegalArgumentException( "Sheet1이 없습니다." );
    }
    DataFormatter fmt = new DataFormatter();
    int headerRowNum = sheet.getFirstRowNum();
    Row headerRow = sheet.getRow( headerRowNum );
    if (headerRow == null) {
      throw new IllegalArgumentException( "Sheet1 헤더 행이 없습니다." );
    }
    int colStart = findColumnIndex( headerRow, fmt, SHEET1_HEADER_START );
    int colEnd = findColumnIndex( headerRow, fmt, SHEET1_HEADER_END );
    int colGender = findColumnIndex( headerRow, fmt, SHEET1_HEADER_GENDER );
    if (colStart < 0 || colEnd < 0 || colGender < 0) {
      throw new IllegalArgumentException( "Sheet1에 '분석 시작일자', '분석 종료일자', '분석 성별' 컬럼이 필요합니다." );
    }
    Row dataRow = sheet.getRow( headerRowNum + 1 );
    if (dataRow == null) {
      throw new IllegalArgumentException( "Sheet1 데이터 행이 없습니다." );
    }
    LocalDate startDate = getCellAsLocalDate( dataRow.getCell( colStart ), fmt );
    LocalDate endDate = getCellAsLocalDate( dataRow.getCell( colEnd ), fmt );
    Integer genderConceptId = getCellAsInteger( dataRow.getCell( colGender ), fmt );
    if (startDate == null || endDate == null || genderConceptId == null) {
      throw new IllegalArgumentException( "Sheet1 분석 시작일자, 종료일자, 분석 성별(concept_id)을 입력해 주세요." );
    }
    if (!startDate.isBefore( endDate ) && !startDate.equals( endDate )) {
      throw new IllegalArgumentException( "분석 시작일자는 분석 종료일자 이전이어야 합니다." );
    }
    return new AnalysisDatasetCondition( startDate, endDate, genderConceptId );
  }

  private List<DomainConceptDto> parseSheet2( Sheet sheet ) {
    List<DomainConceptDto> list = new ArrayList<>();
    if (sheet == null) {
      return list;
    }
    DataFormatter fmt = new DataFormatter();
    int headerRowNum = sheet.getFirstRowNum();
    Row headerRow = sheet.getRow( headerRowNum );
    if (headerRow == null) {
      return list;
    }
    int colDomain = findColumnIndexIgnoreCase( headerRow, fmt, SHEET2_HEADER_DOMAIN );
    int colConceptId = findColumnIndexIgnoreCase( headerRow, fmt, SHEET2_HEADER_CONCEPT_ID );
    if (colDomain < 0 || colConceptId < 0) {
      return list;
    }
    for (int r = headerRowNum + 1; r <= sheet.getLastRowNum(); r++) {
      Row row = sheet.getRow( r );
      if (row == null)
        continue;
      String domain = getCellAsString( row.getCell( colDomain ), fmt );
      Integer conceptId = getCellAsInteger( row.getCell( colConceptId ), fmt );
      if (domain == null || domain.isBlank() || conceptId == null)
        continue;
      list.add( new DomainConceptDto( domain.trim(), conceptId ) );
    }
    return list;
  }

  private static int findColumnIndex( Row headerRow, DataFormatter fmt, String headerName ) {
    int last = headerRow.getLastCellNum();
    if (last <= 0) {
      return -1;
    }
    for (int i = 0; i < last; i++) {
      String v = getCellAsString( headerRow.getCell( i ), fmt );
      if (headerName.equals( v != null ? v.trim() : null ))
        return i;
    }
    return -1;
  }

  private static int findColumnIndexIgnoreCase( Row headerRow, DataFormatter fmt, String headerName ) {
    int last = headerRow.getLastCellNum();
    if (last <= 0) {
      return -1;
    }
    String lower = headerName.toLowerCase();
    for (int i = 0; i < last; i++) {
      String v = getCellAsString( headerRow.getCell( i ), fmt );
      if (v != null && v.trim().equalsIgnoreCase( lower ))
        return i;
    }
    for (int i = 0; i < last; i++) {
      String v = getCellAsString( headerRow.getCell( i ), fmt );
      if (v != null && v.trim().equalsIgnoreCase( headerName ))
        return i;
    }
    return -1;
  }

  private static CellType effectiveCellType( Cell cell ) {
    CellType t = cell.getCellType();
    if (t == CellType.FORMULA) {
      t = cell.getCachedFormulaResultType();
    }
    return t;
  }

  private static LocalDate getCellAsLocalDate( Cell cell, DataFormatter fmt ) {
    if (cell == null)
      return null;
    CellType t = effectiveCellType( cell );
    if (t == CellType.NUMERIC && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted( cell )) {
      Date d = cell.getDateCellValue();
      return d != null ? d.toInstant().atZone( ZoneId.systemDefault() ).toLocalDate() : null;
    }
    String s = fmt.formatCellValue( cell );
    if (s == null || s.isBlank())
      return null;
    try {
      return LocalDate.parse( s.trim() );
    } catch (DateTimeParseException e) {
      return null;
    }
  }

  private static Integer getCellAsInteger( Cell cell, DataFormatter fmt ) {
    if (cell == null)
      return null;
    CellType t = effectiveCellType( cell );
    if (t == CellType.NUMERIC) {
      double d = cell.getNumericCellValue();
      if (d < Integer.MIN_VALUE || d > Integer.MAX_VALUE || d != Math.rint( d )) {
        return null;
      }
      return (int) d;
    }
    String s = fmt.formatCellValue( cell );
    if (s == null || s.isBlank())
      return null;
    try {
      return Integer.parseInt( s.trim() );
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private static String getCellAsString( Cell cell, DataFormatter fmt ) {
    if (cell == null)
      return null;
    return fmt.formatCellValue( cell );
  }

  /** 파싱 결과 래퍼 */
  public static final class ParsedAnalysisDataset {
    public final AnalysisDatasetCondition condition;
    public final List<DomainConceptDto> domainConcepts;

    public ParsedAnalysisDataset(AnalysisDatasetCondition condition, List<DomainConceptDto> domainConcepts) {
      this.condition = condition;
      this.domainConcepts = domainConcepts != null ? domainConcepts : List.of();
    }
  }
}
