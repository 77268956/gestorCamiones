package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CamionRepository  extends JpaRepository<Camion, Long> {

}
