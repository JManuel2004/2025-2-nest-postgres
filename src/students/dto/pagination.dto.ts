// Importaciones para transformación y validación de datos
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

/**
 * DTO para paginación de resultados
 * 
 * Uso: Limitar cantidad de resultados devueltos en listados
 * Caso de uso: GET /api/students?limit=10&offset=20
 * 
 * ¿Por qué paginación?
 * - Evita cargar miles de registros de una vez
 * - Mejora rendimiento del servidor y cliente
 * - Reduce consumo de ancho de banda
 */
export class PaginationDto{
    /**
     * @IsOptional: Campo opcional
     * @IsPositive: Debe ser mayor que 0
     * @Type(() => Number): Transforma string de query param a número
     * 
     * limit: Cantidad máxima de registros a devolver
     * 
     * ¿Por qué @Type(() => Number)?
     * Los query parameters de HTTP siempre llegan como strings
     * GET /api/students?limit=10
     * Sin @Type: limit sería "10" (string)
     * Con @Type: limit será 10 (number)
     * 
     * Ejemplo: limit=10 devuelve máximo 10 estudiantes
     * SQL: LIMIT 10
     * 
     * Caso de uso: Mostrar 20 resultados por página
     */
    @IsOptional()
    @IsPositive()
    @Type(()=> Number)
    limit: number;

    /**
     * @IsOptional: Campo opcional
     * @IsPositive: Debe ser mayor que 0 (técnicamente debería permitir 0)
     * @Type(() => Number): Transforma string a número
     * @Min(0): Valor mínimo de 0
     * 
     * offset: Desde qué registro empezar (cuántos saltar)
     * 
     * Ejemplo:
     * - offset=0: Empieza desde el primer registro (página 1)
     * - offset=10: Salta los primeros 10 registros (página 2 si limit=10)
     * - offset=20: Salta los primeros 20 registros (página 3 si limit=10)
     * 
     * SQL: OFFSET 20
     * 
     * Fórmula para páginas:
     * offset = (página - 1) * limit
     * Página 1: offset=0
     * Página 2: offset=10 (si limit=10)
     * Página 3: offset=20 (si limit=10)
     * 
     * Caso de uso:
     * GET /api/students?limit=10&offset=0  (página 1, registros 1-10)
     * GET /api/students?limit=10&offset=10 (página 2, registros 11-20)
     * GET /api/students?limit=10&offset=20 (página 3, registros 21-30)
     */
    @IsOptional()
    @IsPositive()
    @Type(()=> Number)
    @Min(0)
    offset:number;
}