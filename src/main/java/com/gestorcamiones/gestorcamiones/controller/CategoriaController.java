package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.Categoria;
import com.gestorcamiones.gestorcamiones.repository.CategoriaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    public CategoriaController(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Categoria> listar() {
        return categoriaRepository.findAll().stream()
                .sorted(Comparator.comparing(Categoria::getIdCategoria, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @PostMapping
    public Categoria crear(@RequestBody Categoria body) {
        if (body == null || body.getNombre() == null || body.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la categoria es obligatorio");
        }
        Categoria cat = new Categoria();
        cat.setNombre(body.getNombre().trim());
        cat.setDescripcion(body.getDescripcion());
        return categoriaRepository.save(cat);
    }
}

