package com.gestorcamiones.gestorcamiones.config;

import com.google.api.services.drive.Drive;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.nio.file.Path;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {

    @Bean
    @ConditionalOnProperty(name = "app.backup.drive.enabled", havingValue = "true", matchIfMissing = true)
    public Drive googleDriveClient(
            @Value("${app.backup.drive.credentials-file:}") String credentialsFile
    ) throws Exception {
        if (credentialsFile == null || credentialsFile.isBlank()) {
            throw new IllegalStateException("Debe configurar app.backup.drive.credentials-file para usar Google Drive");
        }

        GoogleCredentials credentials;
        try (FileInputStream in = new FileInputStream(Path.of(credentialsFile).toFile())) {
            credentials = GoogleCredentials.fromStream(in)
                    .createScoped(Collections.singleton("https://www.googleapis.com/auth/drive"));
        }

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials)
        ).setApplicationName("gestorcamiones-backup").build();
    }
}
