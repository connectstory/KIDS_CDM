package kr.or.kids.domain.cm.upload.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@RestController
@RequestMapping("/upload/test")
public class UploadTestController {

  String timestamp="timestamp";
  String status="status";

  
  /**
   * hello 처리를 수행한다.
   *
   * @return 처리 결과
   */
  @GetMapping("/hello")
  public ResponseEntity<Map<String, Object>> hello() {
    Map<String, Object> response = new HashMap<>();
    response.put( "message", "Hello! CDM Backend Test API" );
    response.put( timestamp, LocalDateTime.now() );
    response.put( status, "success" );

    return ResponseEntity.ok( response );
  }

  
  /**
   * helloWithName 처리를 수행한다.
   *
   * @param name name
   * @return 처리 결과
   */
  @GetMapping("/hello/name")
  public ResponseEntity<Map<String, Object>> helloWithName( @RequestParam(required = false, defaultValue = "Guest") String name ) {

    Map<String, Object> response = new HashMap<>();
    response.put( "message", "Hello, " + name + "! Welcome to CDM Backend" );
    response.put( timestamp, LocalDateTime.now() );
    response.put( status, "success" );
    response.put( "user", name );

    return ResponseEntity.ok( response );
  }

  
  /**
   * health 처리를 수행한다.
   *
   * @return 처리 결과
   */
  @GetMapping("/health")
  public ResponseEntity<Map<String, Object>> health() {
    Map<String, Object> response = new HashMap<>();
    response.put( status, "UP" );
    response.put( "service", "CDM Backend" );
    response.put( timestamp, LocalDateTime.now() );
    response.put( "version", "1.0.0" );
    response.put( "environment", "test" );

    return ResponseEntity.ok( response );
  }

  
  /**
   * info 처리를 수행한다.
   *
   * @return 처리 결과
   */
  @GetMapping("/info")
  public ResponseEntity<Map<String, Object>> info() {
    Map<String, Object> response = new HashMap<>();
    response.put( "application", "CDM Backend" );
    response.put( "description", "CDM(Construction Data Management) Backend Service" );
    response.put( "version", "1.0.0" );
    response.put( "java", System.getProperty( "java.version" ) );
    response.put( "os", System.getProperty( "os.name" ) );
    response.put( timestamp, LocalDateTime.now() );

    return ResponseEntity.ok( response );
  }

  
  /**
   * echo 처리를 수행한다.
   *
   * @param message message
   * @return 처리 결과
   */
  @GetMapping("/echo")
  public ResponseEntity<Map<String, Object>> echo( @RequestParam(required = false, defaultValue = "Hello World") String message ) {

    Map<String, Object> response = new HashMap<>();
    response.put( "original", message );
    response.put( "uppercase", message.toUpperCase() );
    response.put( "lowercase", message.toLowerCase() );
    response.put( "length", message.length() );
    response.put( timestamp, LocalDateTime.now() );

    return ResponseEntity.ok( response );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @return 처리 결과
   */
  @GetMapping("/time")
  public ResponseEntity<Map<String, Object>> getCurrentTime() {
    LocalDateTime now = LocalDateTime.now();

    Map<String, Object> response = new HashMap<>();
    response.put( "currentTime", now );
    response.put( "year", now.getYear() );
    response.put( "month", now.getMonthValue() );
    response.put( "day", now.getDayOfMonth() );
    response.put( "hour", now.getHour() );
    response.put( "minute", now.getMinute() );
    response.put( "second", now.getSecond() );

    return ResponseEntity.ok( response );
  }
}
