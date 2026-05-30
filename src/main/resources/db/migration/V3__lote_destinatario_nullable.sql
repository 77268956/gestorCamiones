-- V3: Permitir lote sin cliente destinatario (opcional)
ALTER TABLE "lote"
    ALTER COLUMN "id_cliente_destinatario" DROP NOT NULL;

