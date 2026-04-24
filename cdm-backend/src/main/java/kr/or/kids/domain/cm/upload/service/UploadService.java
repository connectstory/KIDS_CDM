package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.*;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
public class UploadService {

    @Value("${app.upload.root:/data/uploads}")
    Path root;

    @Value("${app.upload.tmp:/data/uploads/.tmp}")
    Path tmpRoot;

    @Value("${app.upload.chunk-size-mb:16}")
    int chunkSizeMB;

    @Value("${app.upload.allowed-slots}")
    String allowed;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".csv", ".xlsx", ".xls", ".tsv");

    private final Map<String, UploadState> states = new ConcurrentHashMap<>();

    private Set<String> allowedSlots() {
        Set<String> s = new HashSet<>();
        for (String t : allowed.split(",")) s.add(t.trim());
        return s;
    }

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    public List<String> getAllowedSlotsList() {
        List<String> list = new ArrayList<>();
        for (String t : allowed.split(",")) {
            String s = t.trim();
            if (!s.isEmpty()) list.add(s);
        }
        return list;
    }

    
    /**
     * inferTableFromFileName 처리를 수행한다.
     *
     * @param fileName fileName
     * @return 처리 결과
     */
    public String inferTableFromFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) return null;
        String nameWithoutExt = fileName.contains(".") ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
        String normalized = nameWithoutExt.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_]", "_");
        List<String> slots = new ArrayList<>(allowedSlots());
        slots.sort((a, b) -> Integer.compare(b.length(), a.length())); 
        for (String slot : slots) {
            if (normalized.equals(slot) || normalized.contains("_" + slot + "_") || normalized.startsWith(slot + "_") || normalized.endsWith("_" + slot)) {
                return slot;
            }
        }
        return null;
    }

    /**
     * init 처리를 수행한다.
     *
     * @param req req
     * @return 처리 결과
     */
    public InitResponse init(InitRequest req) {
        String slot = (req.tableName() != null && !req.tableName().isBlank())
                ? req.tableName().trim().toLowerCase(Locale.ROOT)
                : inferTableFromFileName(req.fileName());
        if (slot == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Could not infer table from file name. Use a name containing the table (e.g. visit_occurrence.xlsx) or select table.");
        }
        if (!allowedSlots().contains(slot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid slot: " + slot);
        }
        if (req.fileSize() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid size");
        String fileName = req.fileName();
        if (fileName == null || fileName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        }
        String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only CSV, Excel or TSV files are allowed (.csv, .xlsx, .xls, .tsv). Got: " + (ext.isEmpty() ? "no extension" : ext));
        }

        String uploadId = UUID.randomUUID().toString();
        long chunkSize = chunkSizeMB * 1024L * 1024L;
        int parts = (int) Math.ceil((double) req.fileSize() / chunkSize);

        Path dir = tmpRoot.resolve(uploadId);
        try { Files.createDirectories(dir); } catch (IOException e) { throw new RuntimeException(e); }

        Path sparse = dir.resolve("blob.part");
        
        try (var ch = FileChannel.open(sparse, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.SPARSE)) {
            ch.position(req.fileSize() - 1);
            int written = ch.write(ByteBuffer.wrap(new byte[]{0}));
            if (written != 1) {
                throw new IOException("Failed to write sparse file marker");
            }
        } catch (IOException e) { throw new RuntimeException(e); }

        UploadState st = new UploadState(slot, req.fileName(), req.fileSize(), parts, chunkSize, sparse);
        states.put(uploadId, st);

        return new InitResponse(uploadId, chunkSizeMB, parts, List.of());
    }

    /**
     * writeChunk 처리를 수행한다.
     *
     * @param uploadId uploadId
     * @param index index
     * @param body body
     */
    public void writeChunk(String uploadId, int index, InputStream body) throws IOException {
        UploadState st = get(uploadId);
        if (index < 0 || index >= st.totalParts) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "index out of range");

        long offset = st.chunkSize * index;

        try (ReadableByteChannel src = Channels.newChannel(body);
             FileChannel dst = FileChannel.open(st.tmpFile, StandardOpenOption.WRITE)) {
            long pos = offset;
            long n;
            
            while ((n = dst.transferFrom(src, pos, 16 * 1024 * 1024)) > 0) {
                pos += n;
            }
        }
        st.markReceived(index);
    }

    /**
     * status 처리를 수행한다.
     *
     * @param uploadId uploadId
     * @return 처리 결과
     */
    public StatusResponse status(String uploadId) {
        return new StatusResponse(get(uploadId).received());
    }

    /**
     * complete 처리를 수행한다.
     *
     * @param req req
     * @return 처리 결과
     */
    public CompleteResponse complete(CompleteRequest req) throws IOException, NoSuchAlgorithmException {
        UploadState st = get(req.uploadId());
        if (!st.isAllReceived()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not complete");

        
        if (req.sha256() != null && !req.sha256().isBlank()) {
            String calc = sha256Hex(st.tmpFile);
            if (!calc.equalsIgnoreCase(req.sha256())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checksum mismatch");
            }
        }

        Path slotDir = root.resolve(st.tableName);
        Files.createDirectories(slotDir);
        String storedName = UUID.randomUUID() + "_" + st.fileName;
        Path finalPath = slotDir.resolve(storedName);

        Files.move(st.tmpFile, finalPath, StandardCopyOption.ATOMIC_MOVE);
        
        cleanup(req.uploadId(), st.tmpFile.getParent());

        

        String url = "/files/" + st.tableName + "/" + storedName; 
        return new CompleteResponse(url, storedName, st.tableName);
    }

    private UploadState get(String id) {
        UploadState st = states.get(id);
        if (st == null) throw new ResponseStatusException(HttpStatus.GONE, "upload expired");
        return st;
    }

    private static String sha256Hex(Path p) throws IOException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (var in = Files.newInputStream(p)) {
            byte[] buf = new byte[1024 * 1024];
            int r;
            while ((r = in.read(buf)) != -1) md.update(buf, 0, r);
        }
        return HexFormat.of().formatHex(md.digest());
    }

    private void cleanup(String uploadId, Path tmpDir) {
        states.remove(uploadId);
        
        try (Stream<Path> walk = Files.walk(tmpDir)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try { Files.deleteIfExists(path); } catch (Exception ex) {
                            UploadNonFatal.discard( ex );
                        }
                    });
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }
}
