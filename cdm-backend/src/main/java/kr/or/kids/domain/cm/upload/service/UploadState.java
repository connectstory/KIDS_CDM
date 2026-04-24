package kr.or.kids.domain.cm.upload.service;

import java.nio.file.Path;
import java.util.BitSet;
import java.util.List;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
class UploadState {
    final String tableName;
    final String fileName;
    final long fileSize;
    final int totalParts;
    final long chunkSize;
    final Path tmpFile;
    final BitSet bitset = new BitSet();

    /**
     * UploadState 처리를 수행한다.
     *
     * @param tableName tableName
     * @param fileName fileName
     * @param fileSize fileSize
     * @param totalParts totalParts
     * @param chunkSize chunkSize
     * @param tmpFile tmpFile
     */
    UploadState(String tableName, String fileName, long fileSize, int totalParts, long chunkSize, Path tmpFile) {
        this.tableName = tableName;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.totalParts = totalParts;
        this.chunkSize = chunkSize;
        this.tmpFile = tmpFile;
    }
    synchronized void markReceived(int index) { bitset.set(index); }
    boolean isAllReceived() { return bitset.cardinality() == totalParts; }
    List<Integer> received() { return bitset.stream().boxed().toList(); }
}
