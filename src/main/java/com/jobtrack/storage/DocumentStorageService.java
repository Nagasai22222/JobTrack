package com.jobtrack.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface DocumentStorageService {

    String storeFile(MultipartFile file, String storedFileName);

    Resource loadFile(String storedFileName);

    void deleteFile(String storedFileName);

    Path getStorageDirectory();
}
