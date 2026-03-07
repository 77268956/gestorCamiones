package com.gestorcamiones.gestorcamiones.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaLoginPageDTO {
    private List<AuditoriaLoginDTO> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
}
