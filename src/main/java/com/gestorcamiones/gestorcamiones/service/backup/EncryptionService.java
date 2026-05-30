package com.gestorcamiones.gestorcamiones.service.backup;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final String ALGO = "AES/GCM/NoPadding";
    private static final int SALT_LEN = 16;
    private static final int IV_LEN = 12;
    private static final int TAG_LEN = 128;

    public Path encryptFile(Path input, Path output, String password) throws Exception {
        byte[] salt = new byte[SALT_LEN];
        byte[] iv = new byte[IV_LEN];
        SecureRandom random = new SecureRandom();
        random.nextBytes(salt);
        random.nextBytes(iv);

        SecretKey key = deriveKey(password, salt);
        Cipher cipher = Cipher.getInstance(ALGO);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LEN, iv));

        byte[] data = Files.readAllBytes(input);
        byte[] encrypted = cipher.doFinal(data);
        byte[] payload = new byte[salt.length + iv.length + encrypted.length];
        System.arraycopy(salt, 0, payload, 0, salt.length);
        System.arraycopy(iv, 0, payload, salt.length, iv.length);
        System.arraycopy(encrypted, 0, payload, salt.length + iv.length, encrypted.length);
        Files.write(output, payload);
        return output;
    }

    public Path decryptFile(Path input, Path output, String password) throws Exception {
        byte[] payload = Files.readAllBytes(input);
        byte[] salt = new byte[SALT_LEN];
        byte[] iv = new byte[IV_LEN];
        byte[] encrypted = new byte[payload.length - SALT_LEN - IV_LEN];
        System.arraycopy(payload, 0, salt, 0, SALT_LEN);
        System.arraycopy(payload, SALT_LEN, iv, 0, IV_LEN);
        System.arraycopy(payload, SALT_LEN + IV_LEN, encrypted, 0, encrypted.length);

        SecretKey key = deriveKey(password, salt);
        Cipher cipher = Cipher.getInstance(ALGO);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LEN, iv));
        Files.write(output, cipher.doFinal(encrypted));
        return output;
    }

    private SecretKey deriveKey(String password, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 256);
        byte[] encoded = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(encoded, "AES");
    }
}
