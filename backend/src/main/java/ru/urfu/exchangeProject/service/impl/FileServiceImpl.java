package ru.urfu.exchangeProject.service.impl;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.exception.customEx.news.FileInvalidException;
import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;
import ru.urfu.exchangeProject.service.FileService;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    public final String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";

    public FileServiceImpl() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Не удалось создать директорию для загрузки файлов", e);
        }
    }

    @Override
    public String save(MultipartFile file) {
        if (file == null) {
            return null;
        }

        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE) {
            throw new FileInvalidException();
        }

        String extension = validateImage(file);

        try {
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID() + "." + extension;
            Path targetPath = uploadPath.resolve(fileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath);
            }

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Ошибка при сохранении файла", e);
        }
    }

    private String validateImage(MultipartFile file) {
        try (
                InputStream inputStream = file.getInputStream();
                ImageInputStream imageInputStream = ImageIO.createImageInputStream(inputStream)
        ) {
            if (imageInputStream == null) {
                throw new FileInvalidException();
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (!readers.hasNext()) {
                throw new FileInvalidException();
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInputStream, false, true);
                String format = reader.getFormatName()
                        .toLowerCase(Locale.ROOT);
                if (!format.equals("jpeg") && !format.equals("jpg") && !format.equals("png")) {
                    throw new FileInvalidException();
                }
                if (reader.getWidth(0) <= 0 || reader.getHeight(0) <= 0) {
                    throw new FileInvalidException();
                }
                if (reader.read(0) == null) {
                    throw new FileInvalidException();
                }
                return format.equals("png") ? "png" : "jpg";
            } finally {
                reader.dispose();
            }

        } catch (IOException e) {
            throw new FileInvalidException();
        }
    }

    @Override
    public void delete(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }
        try {
            var filePath = Paths.get(uploadDir, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при удалении файла", e);
        }
    }

    @Override
    public Resource getFileResource(String fileTitle)
            throws MalformedURLException, NotFoundException {

        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path normalizedPath = path.resolve(fileTitle).normalize();

        if (!normalizedPath.startsWith(path)) {
            throw new FileInvalidException();
        }

        Resource resource = new UrlResource(normalizedPath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new NotFoundException("Файл не найден");
        }

        return resource;
    }
}