package com.gestorcamiones.gestorcamiones.service.usuario;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Generador de contrasenas seguras.
 *
 * No existe una "norma ISO unica" para formato de contrasena, pero esto apunta a
 * buenas practicas: longitud >= 16, mezcla de mayusculas/minusculas/digitos/simbolos,
 * y sin caracteres facilmente confundibles.
 */
final class SecurePasswordGenerator {

    private static final SecureRandom RNG = new SecureRandom();

    // Evitamos caracteres confundibles: O0, l1, I, etc.
//    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
//    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
//    private static final String DIGIT = "23456789";
//    private static final String SYMBOL = "!@#$%&.";

    // solo para pruebas
    private static final String UPPER = "ABC";
    private static final String LOWER = "abc";
    private static final String DIGIT = "123";
    private static final String SYMBOL = ".";

    private SecurePasswordGenerator() {}

    static String generate(int length) {
        if (length < 12) {
            throw new IllegalArgumentException("Password length too short: " + length);
        }

        List<Character> chars = new ArrayList<>(length);
        chars.add(randomChar(UPPER));
        chars.add(randomChar(LOWER));
        chars.add(randomChar(DIGIT));
        chars.add(randomChar(SYMBOL));

        String all = UPPER + LOWER + DIGIT + SYMBOL;
        while (chars.size() < 3) {
            chars.add(randomChar(all));
        }

        Collections.shuffle(chars, RNG);
        StringBuilder sb = new StringBuilder(length);
        for (char c : chars) sb.append(c);
        return sb.toString();
    }

    private static char randomChar(String alphabet) {
        return alphabet.charAt(RNG.nextInt(alphabet.length()));
    }
}

