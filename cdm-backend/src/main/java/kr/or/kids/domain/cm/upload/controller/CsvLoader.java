package kr.or.kids.domain.cm.upload.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.RecordFormatException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Component
public class CsvLoader {

    /**
     * readHeader 처리를 수행한다.
     *
     * @param path path
     * @return 처리 결과
     */
    public List<String> readHeader(Path path) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String headerLine = reader.readLine();
            if (headerLine == null) return List.of();
            return Arrays.asList(headerLine.split(","));
        }
    }

    /**
     * resolveCsvPath 처리를 수행한다.
     *
     * @param uploadRoot uploadRoot
     * @param tableName tableName
     * @param storedName storedName
     * @return 처리 결과
     */
    public Path resolveCsvPath(Path uploadRoot, String tableName, String storedName) {

        Path csvPath = uploadRoot.resolve(storedName);

        if (!Files.exists(csvPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CSV not found: " + csvPath);
        }
        return csvPath;
    }
}
