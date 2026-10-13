package com.jobtrack.storage;

import com.jobtrack.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class LocalDocumentStorageService implements DocumentStorageService {

    private final Path storageDirectory;

    public LocalDocumentStorageService(@Value("${jobtrack.storage.upload-dir:uploads/job-applications}") String uploadDir) {
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload storage directory", e);
        }
    }

    @Override
    public Path getStorageDirectory() {
        return this.storageDirectory;
    }

    @Override
    public String storeFile(MultipartFile file, String storedFileName) {
        Path targetPath = this.storageDirectory.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file storage path");
        }

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file on disk", e);
        }
    }

    @Override
    public Resource loadFile(String storedFileName) {
        Path filePath = this.storageDirectory.resolve(storedFileName).normalize();

        if (!filePath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid document path");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found or not readable on disk");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Could not read file from disk");
        }
    }

    @Override
    public void deleteFile(String storedFileName) {
        Path filePath = this.storageDirectory.resolve(storedFileName).normalize();

        if (filePath.startsWith(this.storageDirectory)) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
                // Graceful handling of missing or inaccessible filesystem entries
            }
        }
    }
}
